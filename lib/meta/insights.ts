import type { Post } from "@/lib/generated/prisma/client"
import type { PageTarget } from "@/lib/meta/publish"
import { graphGet } from "@/lib/meta/graph"

interface PostMetrics {
  reach: number | null
  views: number | null
  likes: number | null
  comments: number | null
  shares: number | null
  saves: number | null
  interactions: number | null
}

type InsightRow = { name: string; values?: { value: number }[]; total_value?: { value: number } }

function readInsights(rows: InsightRow[]) {
  const out: Record<string, number> = {}
  for (const r of rows) {
    const v = r.total_value?.value ?? r.values?.[0]?.value
    if (typeof v === "number") out[r.name] = v
  }
  return out
}

export async function fetchMetrics(post: Post, meta: PageTarget): Promise<PostMetrics> {
  if (!post.externalId || !meta.pageAccessToken) throw new Error("Post is not published")
  return post.platform === "INSTAGRAM" ? instagramMetrics(post.externalId, meta.pageAccessToken) : facebookMetrics(post.externalId, meta.pageAccessToken)
}

async function instagramMetrics(mediaId: string, token: string): Promise<PostMetrics> {
  try {
    const res = await graphGet<{ data: InsightRow[] }>(`${mediaId}/insights`, {
      metric: "reach,views,likes,comments,shares,saved,total_interactions",
      access_token: token,
    })
    const m = readInsights(res.data)
    return {
      reach: m.reach ?? null,
      views: m.views ?? null,
      likes: m.likes ?? null,
      comments: m.comments ?? null,
      shares: m.shares ?? null,
      saves: m.saved ?? null,
      interactions: m.total_interactions ?? null,
    }
  } catch {
    // Insights need instagram_manage_insights; basic counts are always available
    const res = await graphGet<{ like_count?: number; comments_count?: number }>(mediaId, { fields: "like_count,comments_count", access_token: token })
    return { reach: null, views: null, likes: res.like_count ?? 0, comments: res.comments_count ?? 0, shares: null, saves: null, interactions: null }
  }
}

type FbInsightRow = { name: string; values?: { value: number | Record<string, number> }[] }

const sum = (v: unknown) => (v && typeof v === "object" ? Object.values(v as Record<string, number>).reduce((s, n) => s + (Number(n) || 0), 0) : null)

/** Fetch each metric separately so one retired or unpermitted metric doesn't hide the others. */
async function facebookInsights(postId: string, token: string, metrics: string[]) {
  const out: Record<string, number | Record<string, number>> = {}
  await Promise.all(
    metrics.map(async (metric) => {
      try {
        const res = await graphGet<{ data: FbInsightRow[] }>(`${postId}/insights`, { metric, access_token: token })
        const v = res.data[0]?.values?.[0]?.value
        if (v !== undefined) out[metric] = v
      } catch {
        // Unavailable for this post (too new, page too small, or metric retired)
      }
    }),
  )
  return out
}

/**
 * Everything comes from Page insights (read_insights), which avoids needing pages_read_user_content.
 * post_impressions* were retired in Nov 2025; media views are the replacement.
 */
async function facebookMetrics(postId: string, token: string): Promise<PostMetrics> {
  const m = await facebookInsights(postId, token, [
    "post_media_view",
    "post_total_media_view_unique",
    "post_reactions_by_type_total",
    "post_activity_by_action_type",
  ])
  const activity = (m.post_activity_by_action_type ?? {}) as Record<string, number>
  const likes = sum(m.post_reactions_by_type_total) ?? activity.like ?? 0
  const comments = activity.comment ?? 0
  const shares = activity.share ?? 0

  return {
    views: typeof m.post_media_view === "number" ? m.post_media_view : null,
    reach: typeof m.post_total_media_view_unique === "number" ? m.post_total_media_view_unique : null,
    likes,
    comments,
    shares,
    saves: null,
    interactions: likes + comments + shares,
  }
}
