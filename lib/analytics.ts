import { db } from "@/lib/db"
import { localParts, WEEKDAYS } from "@/lib/time"
import { PILLARS } from "@/lib/pillars"
import type { Post } from "@/lib/generated/prisma/client"

export type ScoredPost = Post & { engagementRate: number }

export interface Bucket {
  key: string
  label: string
  posts: number
  avgEngagementRate: number
  avgReach: number
}

export interface Analytics {
  published: number
  measured: number
  totalReach: number
  totalInteractions: number
  avgEngagementRate: number
  byPillar: Bucket[]
  byPlatform: Bucket[]
  byWeekday: Bucket[]
  byHour: Bucket[]
  top: ScoredPost[]
  bottom: ScoredPost[]
}

function interactionsOf(p: Post) {
  return p.interactions ?? (p.likes ?? 0) + (p.comments ?? 0) + (p.shares ?? 0) + (p.saves ?? 0)
}

/** Engagement rate = interactions / reach (falls back to views when reach is unavailable). */
export function engagementRate(p: Post) {
  const audience = p.reach || p.views
  if (!audience) return 0
  return interactionsOf(p) / audience
}

function bucketize(posts: ScoredPost[], keyOf: (p: ScoredPost) => string, labelOf: (k: string) => string, order?: string[]): Bucket[] {
  const groups = new Map<string, ScoredPost[]>()
  for (const p of posts) {
    const k = keyOf(p)
    groups.set(k, [...(groups.get(k) ?? []), p])
  }
  const keys = order ? order.filter((k) => groups.has(k)) : [...groups.keys()]
  return keys.map((key) => {
    const g = groups.get(key)!
    return {
      key,
      label: labelOf(key),
      posts: g.length,
      avgEngagementRate: g.reduce((s, p) => s + p.engagementRate, 0) / g.length,
      avgReach: g.reduce((s, p) => s + (p.reach ?? p.views ?? 0), 0) / g.length,
    }
  })
}

export async function getAnalytics(brandId: string, timeZone: string, sinceDays = 90): Promise<Analytics> {
  const since = new Date(Date.now() - sinceDays * 86_400_000)
  const published = await db.post.findMany({
    where: { brandId, status: "PUBLISHED", publishedAt: { gte: since } },
    orderBy: { publishedAt: "desc" },
  })
  const measured: ScoredPost[] = published
    .filter((p) => p.metricsUpdatedAt)
    .map((p) => ({ ...p, engagementRate: engagementRate(p) }))

  const hourBlock = (h: number) => `${String(Math.floor(h / 3) * 3).padStart(2, "0")}`
  const sorted = [...measured].sort((a, b) => b.engagementRate - a.engagementRate)

  return {
    published: published.length,
    measured: measured.length,
    totalReach: measured.reduce((s, p) => s + (p.reach ?? p.views ?? 0), 0),
    totalInteractions: measured.reduce((s, p) => s + interactionsOf(p), 0),
    avgEngagementRate: measured.length ? measured.reduce((s, p) => s + p.engagementRate, 0) / measured.length : 0,
    byPillar: bucketize(measured, (p) => p.pillar, (k) => PILLARS[k as keyof typeof PILLARS].label).sort(
      (a, b) => b.avgEngagementRate - a.avgEngagementRate,
    ),
    byPlatform: bucketize(measured, (p) => p.platform, (k) => (k === "FACEBOOK" ? "Facebook" : "Instagram")),
    byWeekday: bucketize(
      measured,
      (p) => String(localParts(p.publishedAt!, timeZone).weekday),
      (k) => WEEKDAYS[+k].slice(0, 3),
      ["1", "2", "3", "4", "5", "6", "0"],
    ),
    byHour: bucketize(
      measured,
      (p) => hourBlock(localParts(p.publishedAt!, timeZone).hour),
      (k) => `${k}:00–${String(+k + 3).padStart(2, "0")}:00`,
      ["00", "03", "06", "09", "12", "15", "18", "21"],
    ),
    top: sorted.slice(0, 5),
    bottom: sorted.length > 5 ? sorted.slice(-5).reverse() : [],
  }
}
