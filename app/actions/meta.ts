"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireBrand, requireUser } from "@/lib/auth"
import { linkBrandPage } from "@/lib/services/brands"
import { UserError } from "@/lib/errors"
import { refreshMetrics } from "@/lib/jobs"

export async function linkPage(brandId: string, pageId: string | null): Promise<{ error?: string }> {
  const user = await requireUser()
  const own = await db.brand.findFirst({ where: { id: brandId, userId: user.id }, select: { id: true } })
  if (!own) return { error: "Brand not found" }
  try {
    await linkBrandPage(user.id, brandId, pageId)
  } catch (e) {
    if (e instanceof UserError) return { error: e.message }
    throw e
  }
  revalidatePath("/", "layout")
  return {}
}

/** Forget the Facebook login. Brands keep which Page they belong to, so reconnecting re-links them. */
export async function disconnectMeta() {
  const user = await requireUser()
  await db.metaConnection.deleteMany({ where: { userId: user.id } })
  await db.brand.updateMany({ where: { userId: user.id }, data: { pageAccessToken: null } })
  revalidatePath("/", "layout")
}

export async function syncMetrics() {
  const { brand } = await requireBrand()
  const n = await refreshMetrics(brand.id)
  revalidatePath("/", "layout")
  return n
}
