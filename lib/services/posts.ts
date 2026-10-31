import { db } from "@/lib/db"
import type { Pillar, Platform, Post } from "@/lib/generated/prisma/client"
import { deleteImage, saveImage } from "@/lib/media"
import { processImageQueue, publishOne } from "@/lib/jobs"
import { graphDelete } from "@/lib/meta/graph"

import { UserError } from "@/lib/errors"

export { UserError }

export async function getOwnPost(userId: string, id: string) {
  const post = await db.post.findFirst({ where: { id, userId } })
  if (!post) throw new UserError("Post not found")
  return post
}

function assertEditable(post: Post) {
  if (post.status === "PUBLISHED" || post.status === "PUBLISHING") throw new UserError("Published posts can't be changed")
}

export function normalizeHashtags(input: string | string[]) {
  const list = Array.isArray(input) ? input : input.split(/[\s,]+/)
  return list.map((h) => h.trim().replace(/^#/, "")).filter(Boolean)
}

export interface PostPatch {
  caption?: string
  hashtags?: string[]
  imagePrompt?: string
  platform?: Platform
  scheduledAt?: Date | null
}

export async function editPost(userId: string, id: string, patch: PostPatch) {
  const post = await getOwnPost(userId, id)
  assertEditable(post)
  // Browsers submit textarea newlines as CRLF
  const caption = patch.caption?.replace(/\r\n/g, "\n").trim()
  if (caption !== undefined && caption.length < 5) throw new UserError("Caption is too short")
  const scheduledAt = patch.scheduledAt === undefined ? post.scheduledAt : patch.scheduledAt
  if (post.status === "SCHEDULED" && (!scheduledAt || scheduledAt <= new Date())) {
    throw new UserError("A scheduled post needs a publish time in the future (unschedule it first to clear the time)")
  }
  return db.post.update({
    where: { id },
    data: {
      caption,
      // The hook is the caption's opening line; keep it in sync when the caption changes
      hook: caption ? caption.split("\n").find((l) => l.trim())?.trim().slice(0, 200) : undefined,
      hashtags: patch.hashtags && normalizeHashtags(patch.hashtags),
      imagePrompt: patch.imagePrompt?.replace(/\r\n/g, "\n"),
      platform: patch.platform,
      scheduledAt,
      error: post.status === "FAILED" ? post.error : null,
    },
  })
}

/** Schedule at `at`, or at the post's current scheduled time when omitted. */
export async function schedulePost(userId: string, id: string, at?: Date) {
  const post = await getOwnPost(userId, id)
  assertEditable(post)
  const scheduledAt = at ?? post.scheduledAt
  if (!scheduledAt || scheduledAt <= new Date()) throw new UserError("Pick a publish time in the future")
  if (post.platform === "INSTAGRAM" && post.imageState !== "READY") throw new UserError("Instagram posts need a finished image before scheduling")
  return db.post.update({ where: { id }, data: { status: "SCHEDULED", scheduledAt, error: null } })
}

export async function unschedulePost(userId: string, id: string) {
  const post = await getOwnPost(userId, id)
  assertEditable(post)
  return db.post.update({ where: { id }, data: { status: "DRAFT" } })
}

/** Publish immediately. The status update is a compare-and-set so a post is never published twice. */
export async function publishPostNow(userId: string, id: string) {
  const post = await getOwnPost(userId, id)
  assertEditable(post)
  // Check prerequisites first so a post isn't marked FAILED for something the user can fix
  const brand = await db.brand.findUniqueOrThrow({ where: { id: post.brandId } })
  if (!brand.pageId || !brand.pageAccessToken) throw new UserError(`"${brand.name}" has no Facebook Page linked. Link one in Settings first.`)
  if (post.platform === "INSTAGRAM") {
    if (!brand.igUserId) throw new UserError(`${brand.pageName} has no linked Instagram Business account.`)
    if (post.imageState !== "READY") throw new UserError("Instagram posts need a finished image before publishing.")
  }
  const claimed = await db.post.updateMany({ where: { id, status: post.status }, data: { status: "PUBLISHING" } })
  if (!claimed.count) throw new UserError("This post is already being published")
  return publishOne(id)
}

export async function requestNewImage(userId: string, id: string, imagePrompt?: string) {
  const post = await getOwnPost(userId, id)
  assertEditable(post)
  const updated = await db.post.update({
    where: { id },
    data: { imageState: "PENDING", imagePrompt: imagePrompt?.trim() || post.imagePrompt },
  })
  void processImageQueue()
  return updated
}

export interface NewPost {
  platform: Platform
  pillar: Pillar
  caption: string
  hashtags?: string[]
  imagePrompt?: string
  scheduledAt?: Date | null
}

/** A hand-written post (no AI), saved as a draft. */
export async function createPost(userId: string, brandId: string, input: NewPost) {
  const caption = input.caption.replace(/\r\n/g, "\n").trim()
  if (caption.length < 5) throw new UserError("Caption is too short")
  return db.post.create({
    data: {
      userId,
      brandId,
      platform: input.platform,
      pillar: input.pillar,
      caption,
      hook: caption.split("\n").find((l) => l.trim())?.trim().slice(0, 200) ?? caption.slice(0, 200),
      hashtags: normalizeHashtags(input.hashtags ?? []),
      imagePrompt: input.imagePrompt ?? "",
      scheduledAt: input.scheduledAt ?? null,
    },
  })
}

const MAX_IMAGE_BYTES = 20 * 1024 * 1024

/** Download an image from a public URL and use it as the post image (normalised to 1080x1350 JPEG). null removes the image. */
export async function setImageFromUrl(userId: string, id: string, url: string | null, fit: "cover" | "contain" = "cover") {
  const post = await getOwnPost(userId, id)
  assertEditable(post)
  if (url === null) {
    if (post.platform === "INSTAGRAM" && post.status === "SCHEDULED") throw new UserError("Scheduled Instagram posts need an image")
    await deleteImage(post.imageFile)
    return db.post.update({ where: { id }, data: { imageFile: null, imageState: "NONE" } })
  }
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new UserError(`Invalid image URL: ${url}`)
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new UserError("Image URL must be http(s)")
  const res = await fetch(parsed, { headers: { "User-Agent": "Postpilot/1.0 (social media planner)" }, redirect: "follow" }).catch((e) => {
    throw new UserError(`Could not download image: ${(e as Error).message}`)
  })
  if (!res.ok) throw new UserError(`Could not download image: HTTP ${res.status}`)
  const type = res.headers.get("content-type") ?? ""
  if (!type.startsWith("image/")) throw new UserError(`URL is not an image (content-type ${type || "unknown"})`)
  const bytes = Buffer.from(await res.arrayBuffer())
  if (bytes.length > MAX_IMAGE_BYTES) throw new UserError("Image is larger than 20 MB")
  const file = await saveImage(post.id, bytes, fit).catch(() => {
    throw new UserError("The downloaded file could not be read as an image")
  })
  await deleteImage(post.imageFile)
  return db.post.update({ where: { id }, data: { imageFile: file, imageState: "READY", error: null } })
}

export async function deletePost(userId: string, id: string, fromPlatform = false) {
  const post = await getOwnPost(userId, id)
  if (post.status === "PUBLISHING") throw new UserError("Wait until publishing finishes")
  if (fromPlatform && post.externalId) {
    const brand = await db.brand.findUniqueOrThrow({ where: { id: post.brandId } })
    if (!brand.pageAccessToken) throw new UserError(`"${brand.name}" has no Facebook Page connected, so the published post can't be removed`)
    try {
      await graphDelete(post.externalId, { access_token: brand.pageAccessToken })
    } catch (e) {
      throw new UserError(`Could not delete it from ${post.platform === "INSTAGRAM" ? "Instagram" : "Facebook"}: ${(e as Error).message}`)
    }
  }
  await db.post.delete({ where: { id } })
  await deleteImage(post.imageFile)
  return post
}
