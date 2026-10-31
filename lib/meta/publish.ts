import type { Brand, Post } from "@/lib/generated/prisma/client"
import { graphGet, graphPost, GraphError } from "@/lib/meta/graph"
import { publicMediaUrl } from "@/lib/media"

function fullCaption(post: Pick<Post, "caption" | "hashtags">) {
  const tags = post.hashtags.map((h) => `#${h}`).join(" ")
  return tags ? `${post.caption}\n\n${tags}` : post.caption
}

/** The Facebook Page / Instagram account a brand publishes to */
export type PageTarget = Pick<Brand, "pageId" | "pageAccessToken" | "igUserId">

interface PublishResult {
  externalId: string
  permalink: string | null
}

export async function publishPost(post: Post, meta: PageTarget): Promise<PublishResult> {
  if (!meta.pageId || !meta.pageAccessToken) throw new Error("This brand has no Facebook Page linked. Choose one in Settings.")
  return post.platform === "FACEBOOK" ? publishFacebook(post, meta) : publishInstagram(post, meta)
}

async function publishFacebook(post: Post, meta: PageTarget): Promise<PublishResult> {
  const token = meta.pageAccessToken!
  const message = fullCaption(post)
  let externalId: string
  if (post.imageFile) {
    const res = await graphPost<{ id: string; post_id?: string }>(`${meta.pageId}/photos`, {
      url: publicMediaUrl(post.imageFile),
      message,
      published: true,
      access_token: token,
    })
    externalId = res.post_id ?? res.id
  } else {
    const res = await graphPost<{ id: string }>(`${meta.pageId}/feed`, { message, access_token: token })
    externalId = res.id
  }
  const info = await graphGet<{ permalink_url?: string }>(externalId, { fields: "permalink_url", access_token: token }).catch(() => null)
  return { externalId, permalink: info?.permalink_url ?? null }
}

async function publishInstagram(post: Post, meta: PageTarget): Promise<PublishResult> {
  if (!meta.igUserId) throw new Error("This brand's Facebook Page has no linked Instagram Business/Creator account.")
  if (!post.imageFile) throw new Error("Instagram posts need an image. Generate one first.")
  const token = meta.pageAccessToken!

  const container = await graphPost<{ id: string }>(`${meta.igUserId}/media`, {
    image_url: publicMediaUrl(post.imageFile),
    caption: fullCaption(post),
    access_token: token,
  })

  // Instagram downloads and processes the image asynchronously
  for (let attempt = 0; attempt < 20; attempt++) {
    const { status_code } = await graphGet<{ status_code: string }>(container.id, { fields: "status_code", access_token: token })
    if (status_code === "FINISHED") break
    if (status_code === "ERROR" || status_code === "EXPIRED") {
      throw new GraphError(`Instagram could not process the image (${status_code}). Check that APP_URL is publicly reachable.`)
    }
    if (attempt === 19) throw new GraphError("Instagram took too long to process the image")
    await new Promise((r) => setTimeout(r, 3000))
  }

  const published = await graphPost<{ id: string }>(`${meta.igUserId}/media_publish`, { creation_id: container.id, access_token: token })
  const info = await graphGet<{ permalink?: string }>(published.id, { fields: "permalink", access_token: token }).catch(() => null)
  return { externalId: published.id, permalink: info?.permalink ?? null }
}
