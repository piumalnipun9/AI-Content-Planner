"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { ACTIVE_BRAND_COOKIE, requireUser } from "@/lib/auth"
import { brandSchema } from "@/lib/brand"
import { linkBrandPage } from "@/lib/services/brands"
import { UserError } from "@/lib/errors"
import type { FormState } from "@/app/actions/auth"

async function setActiveBrand(brandId: string) {
  ;(await cookies()).set(ACTIVE_BRAND_COOKIE, brandId, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 })
}

/** Create a brand (brandId null) or update one. The form's `pageId` links the brand to a Facebook Page. */
export async function saveBrand(brandId: string | null, _: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser()
  const parsed = brandSchema.safeParse(Object.fromEntries(form))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  let id = brandId
  if (id) {
    const own = await db.brand.findFirst({ where: { id, userId: user.id }, select: { id: true } })
    if (!own) return { error: "Brand not found" }
    await db.brand.update({ where: { id }, data: parsed.data })
  } else {
    id = (await db.brand.create({ data: { userId: user.id, ...parsed.data } })).id
  }

  if (form.has("pageId")) {
    try {
      await linkBrandPage(user.id, id, String(form.get("pageId")) || null)
    } catch (e) {
      if (!(e instanceof UserError)) throw e
      return { error: e.message }
    }
  }

  revalidatePath("/", "layout")
  if (!brandId) {
    await setActiveBrand(id)
    redirect("/dashboard")
  }
  return { ok: "Brand profile saved" }
}

export async function switchBrand(brandId: string) {
  const user = await requireUser()
  const own = await db.brand.findFirst({ where: { id: brandId, userId: user.id }, select: { id: true } })
  if (!own) return
  await setActiveBrand(brandId)
  revalidatePath("/", "layout")
}

export async function setAutopilot(brandId: string, enabled: boolean) {
  const user = await requireUser()
  await db.brand.updateMany({ where: { id: brandId, userId: user.id }, data: { autopilot: enabled } })
  revalidatePath("/", "layout")
}

export async function deleteBrand(brandId: string) {
  const user = await requireUser()
  await db.brand.deleteMany({ where: { id: brandId, userId: user.id } })
  ;(await cookies()).delete(ACTIVE_BRAND_COOKIE)
  revalidatePath("/", "layout")
  redirect("/brands")
}
