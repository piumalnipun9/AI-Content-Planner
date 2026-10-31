import { db } from "@/lib/db"
import { env } from "@/lib/env"
import type { Brand, Platform, Post } from "@/lib/generated/prisma/client"
import { planPosts, imagePromptFor } from "@/lib/ai/content"
import { generateImage } from "@/lib/ai/gemini"
import { analyzeStrategy, type StrategyReport } from "@/lib/ai/strategy"
import { getAnalytics } from "@/lib/analytics"
import { saveImage, deleteImage } from "@/lib/media"
import { publishPost } from "@/lib/meta/publish"
import { fetchMetrics } from "@/lib/meta/insights"
import { GraphError } from "@/lib/meta/graph"
import { zonedTimeToUtc } from "@/lib/time"
import { UserError } from "@/lib/errors"

/* ---------------------------------------------------------------- content */

export async function latestStrategy(brandId: string) {
  const r = await db.strategyReport.findFirst({ where: { brandId }, orderBy: { createdAt: "desc" } })
  return r ? { ...r, report: r.report as unknown as StrategyReport } : null
}

interface CampaignInput {
  brand: Brand
  name: string
  brief: string
  platforms: Platform[]
  count: number
  /** Local calendar date (YYYY-MM-DD) of day 0 in the brand's timezone */
  startDate: string
  days: number
  schedule: boolean
}

export async function createCampaign(input: CampaignInput) {
  const { brand } = input
  const [strategy, analytics] = await Promise.all([latestStrategy(brand.id), getAnalytics(brand.id, brand.timezone)])

  const planned = await planPosts({
    brand,
    brief: input.brief,
    platforms: input.platforms,
    count: input.count,
    days: input.days,
    strategy: strategy?.report,
    winners: analytics.top.map((p) => ({ caption: p.caption, pillar: p.pillar, platform: p.platform, engagementRate: p.engagementRate })),
  })

  const [y, m, d] = input.startDate.split("-").map(Number)
  const campaign = await db.campaign.create({
    data: {
      userId: brand.userId,
      brandId: brand.id,
      name: input.name,
      brief: input.brief,
      posts: {
        create: planned.map((p) => {
          const scheduledAt = zonedTimeToUtc(y, m, d + p.dayIndex, p.hour, 0, brand.timezone)
          return {
            userId: brand.userId,
            brandId: brand.id,
            platform: p.platform as Platform,
            pillar: p.pillar as Post["pillar"],
            hook: p.hook,
            caption: p.caption,
            hashtags: p.hashtags,
            imagePrompt: p.imagePrompt,
            imageState: "PENDING" as const,
            scheduledAt,
            status: input.schedule && scheduledAt > new Date() ? ("SCHEDULED" as const) : ("DRAFT" as const),
          }
        }),
      },
    },
  })

  void processImageQueue()
  return campaign
}

/* ----------------------------------------------------------------- images */

let imageQueueRunning = false

/** Generate images for posts marked PENDING, one at a time. Safe to call repeatedly. */
export async function processImageQueue() {
  if (imageQueueRunning || !env.hasGemini()) return
  imageQueueRunning = true
  try {
    for (;;) {
      const next = await db.post.findFirst({ where: { imageState: "PENDING" }, orderBy: { scheduledAt: "asc" } })
      if (!next) break
      const claimed = await db.post.updateMany({ where: { id: next.id, imageState: "PENDING" }, data: { imageState: "GENERATING" } })
      if (!claimed.count) continue
      await generatePostImage(next)
    }
  } finally {
    imageQueueRunning = false
  }
}

async function generatePostImage(post: Post) {
  try {
    const brand = await db.brand.findUniqueOrThrow({ where: { id: post.brandId } })
    const bytes = await generateImage(imagePromptFor(brand, post.imagePrompt))
    const file = await saveImage(post.id, bytes)
    await deleteImage(post.imageFile)
    await db.post.update({ where: { id: post.id }, data: { imageFile: file, imageState: "READY" } })
  } catch (e) {
    console.error(`[images] post ${post.id}:`, e)
    await db.post.update({ where: { id: post.id }, data: { imageState: "FAILED", error: `Image generation failed: ${(e as Error).message}` } })
  }
}

/* ------------------------------------------------------------- publishing */

export async function publishOne(postId: string) {
  const post = await db.post.findUniqueOrThrow({ where: { id: postId }, include: { brand: true } })
  try {
    const result = await publishPost(post, post.brand)
    return await db.post.update({
      where: { id: post.id },
      data: { status: "PUBLISHED", publishedAt: new Date(), externalId: result.externalId, permalink: result.permalink, error: null },
    })
  } catch (e) {
    const message = e instanceof GraphError && e.needsReconnect ? `${e.message} — reconnect Facebook in Settings.` : (e as Error).message
    console.error(`[publish] post ${post.id}:`, message)
    return db.post.update({ where: { id: post.id }, data: { status: "FAILED", error: message } })
  }
}

/** Publish every scheduled post that is due. Each post is claimed atomically so it is never posted twice. */
export async function publishDuePosts() {
  const due = await db.post.findMany({
    where: { status: "SCHEDULED", scheduledAt: { lte: new Date() }, imageState: { notIn: ["PENDING", "GENERATING"] } },
    orderBy: { scheduledAt: "asc" },
    take: 20,
  })
  for (const post of due) {
    const claimed = await db.post.updateMany({ where: { id: post.id, status: "SCHEDULED" }, data: { status: "PUBLISHING" } })
    if (claimed.count) await publishOne(post.id)
  }
  return due.length
}

/* ---------------------------------------------------------------- metrics */

export async function refreshPostMetrics(post: Post) {
  const brand = await db.brand.findUniqueOrThrow({ where: { id: post.brandId } })
  if (!brand.pageAccessToken) return
  const metrics = await fetchMetrics(post, brand)
  await db.post.update({ where: { id: post.id }, data: { ...metrics, metricsUpdatedAt: new Date() } })
}

/** Refresh metrics of posts published in the last 30 days (all brands, or one), at most every 3 hours per post. */
export async function refreshMetrics(brandId?: string) {
  const staleBefore = new Date(Date.now() - 3 * 3600_000)
  const posts = await db.post.findMany({
    where: {
      ...(brandId ? { brandId } : {}),
      status: "PUBLISHED",
      externalId: { not: null },
      publishedAt: { gte: new Date(Date.now() - 30 * 86_400_000) },
      OR: [{ metricsUpdatedAt: null }, { metricsUpdatedAt: { lt: staleBefore } }],
    },
    take: 100,
  })
  let ok = 0
  for (const post of posts) {
    try {
      await refreshPostMetrics(post)
      ok++
    } catch (e) {
      console.error(`[metrics] post ${post.id}:`, (e as Error).message)
    }
  }
  return ok
}

/* --------------------------------------------------------------- strategy */

export async function runStrategy(brand: Brand) {
  const analytics = await getAnalytics(brand.id, brand.timezone)
  if (analytics.measured < 3) throw new UserError("Publish at least 3 posts with metrics before running an analysis.")
  const report = await analyzeStrategy(brand, analytics)
  return db.strategyReport.create({ data: { userId: brand.userId, brandId: brand.id, report, postCount: analytics.measured } })
}

/* -------------------------------------------------------------- autopilot */

/**
 * For every brand (each Facebook Page) with autopilot on, independently: refresh the strategy weekly, and when nothing is planned
 * for the coming week, generate and schedule next week's posts.
 */
export async function runAutopilot() {
  if (!env.hasGemini()) return
  const brands = await db.brand.findMany({ where: { autopilot: true } })
  for (const brand of brands) {
    try {
      const latest = await latestStrategy(brand.id)
      if (!latest || latest.createdAt < new Date(Date.now() - 7 * 86_400_000)) {
        await runStrategy(brand).catch(() => {}) // not enough data yet is fine
      }

      const upcoming = await db.post.count({
        where: { brandId: brand.id, status: { in: ["SCHEDULED", "DRAFT"] }, scheduledAt: { gte: new Date(), lte: new Date(Date.now() + 7 * 86_400_000) } },
      })
      if (upcoming > 0) continue

      const platforms: Platform[] = []
      if (brand.pageId) platforms.push("FACEBOOK")
      if (brand.igUserId) platforms.push("INSTAGRAM")
      if (!platforms.length) continue

      const tomorrow = new Date(Date.now() + 86_400_000)
      const startDate = new Intl.DateTimeFormat("en-CA", { timeZone: brand.timezone }).format(tomorrow)
      await createCampaign({
        brand,
        name: `Autopilot week of ${startDate}`,
        brief: "Weekly always-on content following the current strategy and the brand's goals.",
        platforms,
        count: brand.postsPerWeek,
        startDate,
        days: 7,
        schedule: true,
      })
      console.log(`[autopilot] planned ${brand.postsPerWeek} posts for ${brand.name}`)
    } catch (e) {
      console.error(`[autopilot] ${brand.name}:`, (e as Error).message)
    }
  }
}
