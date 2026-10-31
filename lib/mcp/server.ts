import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { db } from "@/lib/db"
import { env } from "@/lib/env"
import type { Brand, Post } from "@/lib/generated/prisma/client"
import { brandSchema } from "@/lib/brand"
import { rewriteCaption } from "@/lib/ai/content"
import { getAnalytics, engagementRate } from "@/lib/analytics"
import { createCampaign, latestStrategy, refreshMetrics, runStrategy } from "@/lib/jobs"
import { publicMediaUrl } from "@/lib/media"
import { availablePages } from "@/lib/meta/oauth"
import { linkBrandPage } from "@/lib/services/brands"
import { PILLARS, PILLAR_KEYS } from "@/lib/pillars"
import { formatInZone, fromLocalInput, localDate } from "@/lib/time"
import * as posts from "@/lib/services/posts"
import { UserError } from "@/lib/services/posts"

const platform = z.enum(["FACEBOOK", "INSTAGRAM"])
const status = z.enum(["DRAFT", "SCHEDULED", "PUBLISHING", "PUBLISHED", "FAILED"])
const pillar = z.enum(PILLAR_KEYS as [string, ...string[]])
const postId = z.string().describe("Post ID from list_posts or create_content_plan")
const when = z
  .string()
  .describe("Publish time: ISO 8601 with offset (2026-11-02T09:30:00+05:30) or local wall-clock time in the brand timezone (2026-11-02T09:30)")

function json(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] }
}

function fail(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true }
}

/** Parse an ISO time with offset, or a local time in the brand's timezone. */
function parseWhen(value: string, timeZone: string) {
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(value)) {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) throw new UserError(`Invalid time: ${value}`)
    return d
  }
  try {
    return fromLocalInput(value, timeZone)
  } catch {
    throw new UserError(`Invalid time: ${value}`)
  }
}

function serializePost(p: Post, tz: string, full = false) {
  const base = {
    id: p.id,
    brandId: p.brandId,
    platform: p.platform,
    status: p.status,
    pillar: p.pillar,
    hook: p.hook,
    scheduledAt: p.scheduledAt?.toISOString() ?? null,
    scheduledLocal: p.scheduledAt ? formatInZone(p.scheduledAt, tz) : null,
    publishedAt: p.publishedAt?.toISOString() ?? null,
    image: p.imageState,
    permalink: p.permalink,
    error: p.error,
    metrics: p.metricsUpdatedAt
      ? { reach: p.reach, views: p.views, likes: p.likes, comments: p.comments, shares: p.shares, saves: p.saves, engagementRate: Number(engagementRate(p).toFixed(4)) }
      : null,
  }
  if (!full) return base
  return {
    ...base,
    caption: p.caption,
    hashtags: p.hashtags,
    imagePrompt: p.imagePrompt,
    imageUrl: p.imageFile && p.imageState === "READY" ? publicMediaUrl(p.imageFile) : null,
    campaignId: p.campaignId,
    appUrl: `${env.appUrl()}/posts/${p.id}`,
  }
}

const imageFit = z
  .enum(["cover", "contain"])
  .default("cover")
  .describe("cover = crop to fill 4:5 (photos); contain = show the whole image on white (product shots, diagrams)")

const brandId = z.string().optional().describe("Brand ID from list_brands. Optional when you have only one brand.")

function brandSummary(b: Brand) {
  return {
    brandId: b.id,
    name: b.name,
    industry: b.industry,
    timezone: b.timezone,
    localDateToday: localDate(b.timezone),
    postsPerWeek: b.postsPerWeek,
    autopilot: b.autopilot,
    facebookPage: b.pageId ? { pageId: b.pageId, name: b.pageName, canPublish: Boolean(b.pageAccessToken) } : null,
    instagram: b.igUserId ? { username: b.igUsername } : null,
  }
}

/**
 * Builds an MCP server whose tools act on behalf of one user and all of their brands.
 * Every tool calls the same service functions the web UI uses.
 */
export function createMcpServer(userId: string) {
  const server = new McpServer(
    { name: "postpilot", version: "2.1.0" },
    {
      instructions: `Postpilot is an AI social media planner. The user can have several brands; each brand is linked to one Facebook Page (and its Instagram account) and has its own profile, posts, analytics, strategy and autopilot.
Start with list_brands. Pass brandId to brand-level tools (it can be omitted when there is only one brand). Post tools work by postId and use that post's brand.
Typical flow: create_content_plan (or create_post for your own captions, with set_post_image to attach an image from a URL) (drafts with AI captions; images render in the background) → get_post → update_post / rewrite_caption / regenerate_image → schedule_post or publish_post_now → later get_analytics and run_strategy_analysis.
Publishing posts publicly to the business's real social accounts: confirm with the user before calling publish_post_now or schedule_post unless they have already asked you to.
Times without an offset are interpreted in the brand's timezone.`,
    },
  )

  /** The brand a tool acts on: the given one (must be the user's), or the only one. */
  const resolveBrand = async (id?: string): Promise<Brand> => {
    if (id) {
      const brand = await db.brand.findFirst({ where: { id, userId } })
      if (!brand) throw new UserError(`Brand ${id} not found. Call list_brands.`)
      return brand
    }
    const brands = await db.brand.findMany({ where: { userId }, orderBy: { createdAt: "asc" } })
    if (brands.length === 1) return brands[0]
    if (!brands.length) throw new UserError("No brands yet. Call create_brand first.")
    throw new UserError(`You have ${brands.length} brands; pass brandId. Brands: ${brands.map((b) => `${b.name} (${b.id})`).join(", ")}`)
  }

  const postWithBrand = async (postId: string) => {
    const post = await posts.getOwnPost(userId, postId)
    const brand = await db.brand.findUniqueOrThrow({ where: { id: post.brandId } })
    return { post, brand }
  }

  /** Wraps a tool body: maps UserError (and other errors) to MCP tool errors. */
  const run = async (fn: () => Promise<ReturnType<typeof json>>) => {
    try {
      return await fn()
    } catch (e) {
      if (e instanceof UserError) return fail(e.message)
      if (e instanceof z.ZodError) return fail(`Invalid input: ${e.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`).join("; ")}`)
      console.error("[mcp]", e)
      return fail(`Failed: ${(e as Error).message}`)
    }
  }

  /* -------------------------------------------------------------- brands */

  server.registerTool(
    "list_brands",
    {
      title: "List brands",
      description: "All brands with their linked Facebook Page / Instagram, autopilot state and post counts. Call this first.",
      annotations: { readOnlyHint: true },
    },
    () =>
      run(async () => {
        const [brands, meta, counts] = await Promise.all([
          db.brand.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
          db.metaConnection.findUnique({ where: { userId }, select: { id: true } }),
          db.post.groupBy({ by: ["brandId", "status"], where: { userId }, _count: true }),
        ])
        return json({
          facebookConnected: Boolean(meta),
          connectFacebookUrl: meta ? undefined : `${env.appUrl()}/settings (connecting requires the user to log in to Facebook in a browser)`,
          aiConfigured: env.hasGemini(),
          brands: brands.map((b) => ({
            ...brandSummary(b),
            posts: Object.fromEntries(counts.filter((c) => c.brandId === b.id).map((c) => [c.status, c._count])),
          })),
        })
      }),
  )

  const profileFields = brandSchema.partial().shape

  server.registerTool(
    "create_brand",
    {
      title: "Create brand",
      description: "Create a new brand profile, optionally linked to a connected Facebook Page (see list_facebook_pages). All profile fields except website are required.",
      inputSchema: { ...brandSchema.shape, pageId: z.string().optional().describe("Facebook Page ID to publish to") },
    },
    ({ pageId, ...input }) =>
      run(async () => {
        const brand = await db.brand.create({ data: { userId, ...brandSchema.parse(input) } })
        const linked = pageId ? await linkBrandPage(userId, brand.id, pageId) : brand
        return json(brandSummary(linked))
      }),
  )

  server.registerTool(
    "get_brand_profile",
    { title: "Get brand profile", description: "The brand brief used for every caption, image and strategy.", inputSchema: { brandId }, annotations: { readOnlyHint: true } },
    ({ brandId }) =>
      run(async () => {
        const b = await resolveBrand(brandId)
        return json({
          ...brandSummary(b),
          description: b.description, offerings: b.offerings, audience: b.audience, tone: b.tone, goals: b.goals,
          website: b.website, language: b.language, visualStyle: b.visualStyle,
        })
      }),
  )

  server.registerTool(
    "update_brand_profile",
    { title: "Update brand profile", description: "Change a brand's profile. Only the fields you pass are changed.", inputSchema: { brandId, ...profileFields } },
    ({ brandId, ...input }) =>
      run(async () => {
        const b = await resolveBrand(brandId)
        const updated = await db.brand.update({ where: { id: b.id }, data: brandSchema.partial().parse(input) })
        return json(brandSummary(updated))
      }),
  )

  server.registerTool(
    "set_autopilot",
    {
      title: "Turn autopilot on or off",
      description: "Per brand. When on, Postpilot plans and schedules that brand's next week automatically whenever nothing is planned, and refreshes its strategy weekly. Posts then publish without human review.",
      inputSchema: { brandId, enabled: z.boolean() },
    },
    ({ brandId, enabled }) =>
      run(async () => {
        const b = await resolveBrand(brandId)
        await db.brand.update({ where: { id: b.id }, data: { autopilot: enabled } })
        return json({ brand: b.name, autopilot: enabled })
      }),
  )

  server.registerTool(
    "list_facebook_pages",
    { title: "List Facebook Pages", description: "Pages shared by the connected Facebook login, and which brand (if any) uses each.", annotations: { readOnlyHint: true } },
    () =>
      run(async () => {
        const [pages, brands] = await Promise.all([availablePages(userId), db.brand.findMany({ where: { userId } })])
        if (!pages.length) throw new UserError(`No Facebook Pages connected. The user must connect Facebook at ${env.appUrl()}/settings`)
        return json(
          pages.map((p) => {
            const owner = brands.find((b) => b.pageId === p.id)
            return { pageId: p.id, name: p.name, instagram: p.igUsername ?? null, brand: owner ? { brandId: owner.id, name: owner.name } : null }
          }),
        )
      }),
  )

  server.registerTool(
    "link_brand_page",
    {
      title: "Link brand to Facebook Page",
      description: "Choose which connected Facebook Page (and its Instagram account) a brand publishes to. pageId null unlinks. A Page can belong to only one brand.",
      inputSchema: { brandId, pageId: z.string().nullable() },
    },
    ({ brandId, pageId }) =>
      run(async () => {
        const b = await resolveBrand(brandId)
        return json(brandSummary(await linkBrandPage(userId, b.id, pageId)))
      }),
  )

  /* --------------------------------------------------------------- posts */

  server.registerTool(
    "list_posts",
    {
      title: "List posts",
      description: "Posts, newest scheduled first. Without brandId, lists posts of all brands.",
      inputSchema: {
        brandId: z.string().optional().describe("Only this brand's posts"),
        status: status.optional(),
        platform: platform.optional(),
        campaignId: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(30),
      },
      annotations: { readOnlyHint: true },
    },
    ({ brandId, status, platform, campaignId, limit }) =>
      run(async () => {
        if (brandId) await resolveBrand(brandId)
        const rows = await db.post.findMany({
          where: { userId, brandId, status, platform, campaignId },
          include: { brand: { select: { name: true, timezone: true } } },
          orderBy: [{ scheduledAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
          take: limit,
        })
        return json(rows.map(({ brand, ...p }) => ({ brand: brand.name, ...serializePost(p, brand.timezone) })))
      }),
  )

  server.registerTool(
    "get_post",
    { title: "Get post", description: "Full post: caption, hashtags, image prompt and public image URL, schedule, metrics.", inputSchema: { postId }, annotations: { readOnlyHint: true } },
    ({ postId }) =>
      run(async () => {
        const { post, brand } = await postWithBrand(postId)
        return json({ brand: brand.name, ...serializePost(post, brand.timezone, true) })
      }),
  )

  server.registerTool(
    "create_content_plan",
    {
      title: "Create content plan",
      description:
        "Have the AI write a campaign of posts for one brand (captions, hashtags, image prompts, posting times) following that brand's profile and strategy. Images are generated in the background (about 10s each); check get_post for image READY. Takes ~30s.",
      inputSchema: {
        brandId,
        name: z.string().min(2).describe("Campaign name"),
        brief: z.string().min(10).describe("What the campaign should achieve; any product, offer or event to feature"),
        platforms: z.array(platform).min(1).default(["INSTAGRAM", "FACEBOOK"]),
        count: z.number().int().min(1).max(30).describe("Number of posts"),
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("First day (YYYY-MM-DD, brand timezone). Default: tomorrow"),
        days: z.number().int().min(1).max(60).default(7),
        schedule: z.boolean().default(false).describe("true = schedule at the suggested times immediately (publishes without review); false = save as drafts"),
      },
    },
    ({ brandId, ...input }) =>
      run(async () => {
        const brand = await resolveBrand(brandId)
        if (!env.hasGemini()) throw new UserError("GEMINI_API_KEY is not configured on the server")
        const campaign = await createCampaign({ brand, ...input, startDate: input.startDate ?? localDate(brand.timezone, 1) })
        const created = await db.post.findMany({ where: { campaignId: campaign.id }, orderBy: { scheduledAt: "asc" } })
        return json({ brand: brand.name, campaignId: campaign.id, posts: created.map((p) => serializePost(p, brand.timezone, true)) })
      }),
  )

  server.registerTool(
    "create_post",
    {
      title: "Create post",
      description:
        "Add one post with your own caption (no AI writing). Optionally attach an image from a public URL. Saved as a draft unless schedule=true. Facebook posts can be text-only; Instagram posts need an image.",
      inputSchema: {
        brandId,
        platform,
        pillar: pillar.describe("Content pillar, used for analytics"),
        caption: z.string().min(5),
        hashtags: z.array(z.string()).default([]).describe("Hashtags, with or without #"),
        imageUrl: z.string().url().optional().describe("Public image URL to download and attach (use images you have the right to use)"),
        imageNote: z.string().optional().describe("Where the image came from / its credit; stored as the image prompt"),
        imageFit,
        scheduledAt: when.optional(),
        schedule: z.boolean().default(false).describe("true = schedule at scheduledAt now (publishes without further review)"),
      },
    },
    ({ brandId, imageUrl, imageNote, imageFit, scheduledAt, schedule, ...input }) =>
      run(async () => {
        const brand = await resolveBrand(brandId)
        const at = scheduledAt ? parseWhen(scheduledAt, brand.timezone) : null
        if (schedule && !at) throw new UserError("Pass scheduledAt to schedule the post")
        let post = await posts.createPost(userId, brand.id, { ...input, pillar: input.pillar as Post["pillar"], imagePrompt: imageNote, scheduledAt: at })
        try {
          if (imageUrl) post = await posts.setImageFromUrl(userId, post.id, imageUrl, imageFit)
          if (schedule) post = await posts.schedulePost(userId, post.id)
        } catch (e) {
          if (e instanceof UserError) throw new UserError(`Post ${post.id} was saved as a draft, but: ${e.message}`)
          throw e
        }
        return json({ brand: brand.name, ...serializePost(post, brand.timezone, true) })
      }),
  )

  server.registerTool(
    "set_post_image",
    {
      title: "Set post image from URL",
      description: "Download an image from a public URL and use it as the post's image (cropped to 1080x1350 JPEG). imageUrl null removes the image.",
      inputSchema: { postId, imageUrl: z.string().url().nullable(), imageNote: z.string().optional().describe("Source / credit, stored as the image prompt"), imageFit },
    },
    ({ postId, imageUrl, imageNote, imageFit }) =>
      run(async () => {
        const { brand } = await postWithBrand(postId)
        let p = await posts.setImageFromUrl(userId, postId, imageUrl, imageFit)
        if (imageNote) p = await db.post.update({ where: { id: p.id }, data: { imagePrompt: imageNote } })
        return json(serializePost(p, brand.timezone, true))
      }),
  )

  server.registerTool(
    "update_post",
    {
      title: "Edit post",
      description: "Change a draft or scheduled post. Only the fields you pass are changed.",
      inputSchema: {
        postId,
        caption: z.string().optional(),
        hashtags: z.array(z.string()).optional().describe("Hashtags, with or without #"),
        imagePrompt: z.string().optional().describe("Saved only; call regenerate_image to render it"),
        platform: platform.optional(),
        scheduledAt: when.optional(),
      },
    },
    ({ postId, scheduledAt, ...patch }) =>
      run(async () => {
        const { brand } = await postWithBrand(postId)
        const updated = await posts.editPost(userId, postId, { ...patch, scheduledAt: scheduledAt ? parseWhen(scheduledAt, brand.timezone) : undefined })
        return json(serializePost(updated, brand.timezone, true))
      }),
  )

  server.registerTool(
    "rewrite_caption",
    {
      title: "Rewrite caption with AI",
      description: "Rewrite a post's caption in its brand's voice following an instruction. Returns the suggestion; set apply=true to save it.",
      inputSchema: { postId, instruction: z.string().describe("e.g. 'shorter, more playful, end with a question'"), apply: z.boolean().default(false) },
    },
    ({ postId, instruction, apply }) =>
      run(async () => {
        const { post, brand } = await postWithBrand(postId)
        const r = await rewriteCaption(brand, post, instruction)
        if (apply) await posts.editPost(userId, postId, { caption: r.caption, hashtags: r.hashtags })
        return json({ applied: apply, caption: r.caption, hashtags: r.hashtags })
      }),
  )

  server.registerTool(
    "regenerate_image",
    {
      title: "Regenerate image",
      description: "Render a new image for the post (optionally with a new prompt). Runs in the background; poll get_post until image is READY.",
      inputSchema: { postId, imagePrompt: z.string().optional() },
    },
    ({ postId, imagePrompt }) =>
      run(async () => {
        const p = await posts.requestNewImage(userId, postId, imagePrompt)
        return json({ postId: p.id, image: p.imageState, imagePrompt: p.imagePrompt })
      }),
  )

  server.registerTool(
    "schedule_post",
    {
      title: "Schedule post",
      description: "Schedule a post to publish automatically to its brand's Page. Without publishAt, uses the post's suggested time. This will publish publicly at that time.",
      inputSchema: { postId, publishAt: when.optional() },
      annotations: { openWorldHint: true },
    },
    ({ postId, publishAt }) =>
      run(async () => {
        const { brand } = await postWithBrand(postId)
        const p = await posts.schedulePost(userId, postId, publishAt ? parseWhen(publishAt, brand.timezone) : undefined)
        return json(serializePost(p, brand.timezone))
      }),
  )

  server.registerTool(
    "unschedule_post",
    { title: "Unschedule post", description: "Move a scheduled post back to drafts.", inputSchema: { postId } },
    ({ postId }) =>
      run(async () => {
        const { brand } = await postWithBrand(postId)
        return json(serializePost(await posts.unschedulePost(userId, postId), brand.timezone))
      }),
  )

  server.registerTool(
    "publish_post_now",
    {
      title: "Publish now",
      description: "Publish the post to its brand's Facebook Page or Instagram immediately. Public and not reversible from here: confirm with the user first.",
      inputSchema: { postId },
      annotations: { destructiveHint: true, openWorldHint: true },
    },
    ({ postId }) =>
      run(async () => {
        const { brand } = await postWithBrand(postId)
        const p = await posts.publishPostNow(userId, postId)
        if (p.status !== "PUBLISHED") throw new UserError(`Publishing failed: ${p.error}`)
        return json({ brand: brand.name, page: brand.pageName, ...serializePost(p, brand.timezone) })
      }),
  )

  server.registerTool(
    "delete_post",
    {
      title: "Delete post",
      description:
        "Delete a post from Postpilot. If it was already published, set fromPlatform=true to also remove it from the Facebook Page / Instagram (permanent; confirm with the user).",
      inputSchema: { postId, fromPlatform: z.boolean().default(false) },
      annotations: { destructiveHint: true, openWorldHint: true },
    },
    ({ postId, fromPlatform }) =>
      run(async () => {
        const p = await posts.deletePost(userId, postId, fromPlatform)
        return json({ deleted: p.id, removedFromPlatform: Boolean(fromPlatform && p.externalId) })
      }),
  )

  /* ---------------------------------------------------- analytics/strategy */

  server.registerTool(
    "get_analytics",
    {
      title: "Get analytics",
      description: "For one brand: totals and average engagement rate by content pillar, platform, weekday and time of day, plus top and weakest posts.",
      inputSchema: { brandId, days: z.number().int().min(1).max(365).default(90) },
      annotations: { readOnlyHint: true },
    },
    ({ brandId, days }) =>
      run(async () => {
        const brand = await resolveBrand(brandId)
        const a = await getAnalytics(brand.id, brand.timezone, days)
        const round = <T extends { avgEngagementRate: number; avgReach: number }>(b: T) => ({ ...b, avgEngagementRate: Number(b.avgEngagementRate.toFixed(4)), avgReach: Math.round(b.avgReach) })
        return json({
          brand: brand.name,
          days,
          published: a.published,
          measured: a.measured,
          totalReach: a.totalReach,
          totalInteractions: a.totalInteractions,
          avgEngagementRate: Number(a.avgEngagementRate.toFixed(4)),
          byPillar: a.byPillar.map(round),
          byPlatform: a.byPlatform.map(round),
          byWeekday: a.byWeekday.map(round),
          byTimeOfDay: a.byHour.map(round),
          topPosts: a.top.map((p) => ({ ...serializePost(p, brand.timezone), pillarLabel: PILLARS[p.pillar].label })),
          weakestPosts: a.bottom.map((p) => serializePost(p, brand.timezone)),
        })
      }),
  )

  server.registerTool(
    "refresh_metrics",
    {
      title: "Refresh metrics",
      description: "Pull the latest reach and engagement from Facebook/Instagram for posts from the last 30 days. Without brandId, refreshes all brands.",
      inputSchema: { brandId: z.string().optional() },
    },
    ({ brandId }) =>
      run(async () => {
        if (brandId) await resolveBrand(brandId)
        const ids = brandId ? [brandId] : (await db.brand.findMany({ where: { userId }, select: { id: true } })).map((b) => b.id)
        let updated = 0
        for (const id of ids) updated += await refreshMetrics(id)
        return json({ postsUpdated: updated })
      }),
  )

  server.registerTool(
    "get_strategy",
    { title: "Get current strategy", description: "A brand's latest AI strategy report, which steers its new content.", inputSchema: { brandId }, annotations: { readOnlyHint: true } },
    ({ brandId }) =>
      run(async () => {
        const brand = await resolveBrand(brandId)
        const s = await latestStrategy(brand.id)
        return json(
          s
            ? { brand: brand.name, createdAt: s.createdAt, basedOnPosts: s.postCount, ...s.report }
            : { brand: brand.name, message: "No strategy yet. Publish at least 3 posts, then call run_strategy_analysis." },
        )
      }),
  )

  server.registerTool(
    "run_strategy_analysis",
    {
      title: "Run strategy analysis",
      description: "Have the AI strategist analyse a brand's recent results and write a new strategy, applied automatically to its future content plans. Needs at least 3 published posts with metrics.",
      inputSchema: { brandId },
    },
    ({ brandId }) =>
      run(async () => {
        const brand = await resolveBrand(brandId)
        if (!env.hasGemini()) throw new UserError("GEMINI_API_KEY is not configured on the server")
        const r = await runStrategy(brand)
        return json({ brand: brand.name, createdAt: r.createdAt, basedOnPosts: r.postCount, ...(r.report as object) })
      }),
  )

  return server
}
