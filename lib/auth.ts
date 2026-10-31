import "server-only"
import { cache } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { readSession } from "@/lib/session"

export const ACTIVE_BRAND_COOKIE = "brand"

/** Current user or null. Deduplicated per request. */
export const getUser = cache(async () => {
  const userId = await readSession()
  if (!userId) return null
  return db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  })
})

export async function requireUser() {
  const user = await getUser()
  if (!user) redirect("/login")
  return user
}

/** All of the user's brands, oldest first. */
export const getBrands = cache(async (userId: string) => db.brand.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }))

/**
 * For app pages: the user and the brand they're working in (chosen with the brand switcher,
 * falling back to their first brand). Users without any brand go to onboarding.
 */
export async function requireBrand() {
  const user = await requireUser()
  const brands = await getBrands(user.id)
  if (!brands.length) redirect("/onboarding")
  const activeId = (await cookies()).get(ACTIVE_BRAND_COOKIE)?.value
  const brand = brands.find((b) => b.id === activeId) ?? brands[0]
  return { user, brand, brands }
}
