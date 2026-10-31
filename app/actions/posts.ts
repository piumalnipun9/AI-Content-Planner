"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireBrand } from "@/lib/auth"
import { db } from "@/lib/db"
import { rewriteCaption } from "@/lib/ai/content"
import { refreshPostMetrics } from "@/lib/jobs"
import { fromLocalInput } from "@/lib/time"
import * as posts from "@/lib/services/posts"
import { UserError } from "@/lib/services/posts"
import type { FormState } from "@/app/actions/auth"

function refresh(id: string) {
  revalidatePath(`/posts/${id}`)
  revalidatePath("/posts")
  revalidatePath("/calendar")
  revalidatePath("/dashboard")
}

async function attempt(fn: () => Promise<unknown>, ok: string): Promise<FormState> {
  try {
    await fn()
    return { ok }
  } catch (e) {
    if (e instanceof UserError) return { error: e.message }
    throw e
  }
}

export async function savePost(id: string, _: FormState, form: FormData): Promise<FormState> {
  const { user } = await requireBrand()
  // Interpret the time in the post's own brand timezone, which may differ from the active brand's
  const { brand } = await db.post.findFirstOrThrow({ where: { id, userId: user.id }, select: { brand: { select: { timezone: true } } } })
  const when = String(form.get("scheduledAt") ?? "")
  const intent = String(form.get("intent") ?? "save")

  let scheduledAt: Date | undefined
  try {
    if (when) scheduledAt = fromLocalInput(when, brand.timezone)
  } catch {
    return { error: "Invalid date/time" }
  }

  const result = await attempt(async () => {
    if (intent === "unschedule") await posts.unschedulePost(user.id, id)
    await posts.editPost(user.id, id, {
      caption: String(form.get("caption") ?? ""),
      hashtags: posts.normalizeHashtags(String(form.get("hashtags") ?? "")),
      imagePrompt: form.has("imagePrompt") ? String(form.get("imagePrompt")) : undefined,
      platform: form.get("platform") === "FACEBOOK" ? "FACEBOOK" : "INSTAGRAM",
      scheduledAt,
    })
    if (intent === "schedule") await posts.schedulePost(user.id, id)
  }, intent === "schedule" ? "Scheduled" : intent === "unschedule" ? "Moved back to drafts" : "Saved")
  refresh(id)
  return result
}

export async function publishNow(id: string): Promise<FormState> {
  const { user } = await requireBrand()
  let message: FormState
  try {
    const result = await posts.publishPostNow(user.id, id)
    message = result.status === "PUBLISHED" ? { ok: "Published!" } : { error: result.error ?? "Publishing failed" }
  } catch (e) {
    if (!(e instanceof UserError)) throw e
    message = { error: e.message }
  }
  refresh(id)
  return message
}

export async function regenerateImage(id: string, imagePrompt?: string) {
  const { user } = await requireBrand()
  await posts.requestNewImage(user.id, id, imagePrompt)
  refresh(id)
}

export async function aiRewrite(id: string, instruction: string): Promise<{ caption?: string; hashtags?: string[]; error?: string }> {
  const { user } = await requireBrand()
  const post = await posts.getOwnPost(user.id, id)
  const brand = await db.brand.findUniqueOrThrow({ where: { id: post.brandId } })
  try {
    const r = await rewriteCaption(brand, post, instruction)
    return { caption: r.caption, hashtags: r.hashtags }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function refreshMetricsFor(id: string): Promise<FormState> {
  const { user } = await requireBrand()
  const post = await posts.getOwnPost(user.id, id)
  try {
    await refreshPostMetrics(post)
  } catch (e) {
    return { error: (e as Error).message }
  }
  refresh(id)
  return { ok: "Metrics updated" }
}

export async function deletePost(id: string) {
  const { user } = await requireBrand()
  await posts.deletePost(user.id, id)
  refresh(id)
  redirect("/posts")
}
