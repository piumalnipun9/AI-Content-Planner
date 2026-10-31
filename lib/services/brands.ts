import { db } from "@/lib/db"
import { UserError } from "@/lib/errors"
import { availablePages, pageFields } from "@/lib/meta/oauth"

/** Link a brand to one of the user's connected Facebook Pages, or unlink it (pageId null). */
export async function linkBrandPage(userId: string, brandId: string, pageId: string | null) {
  if (!pageId) return db.brand.update({ where: { id: brandId }, data: pageFields(null) })
  const page = (await availablePages(userId)).find((p) => p.id === pageId)
  if (!page) throw new UserError("That Facebook Page isn't connected. Reconnect Facebook and tick it.")
  const taken = await db.brand.findFirst({ where: { userId, pageId, NOT: { id: brandId } }, select: { name: true } })
  if (taken) throw new UserError(`${page.name} is already used by the brand "${taken.name}"`)
  return db.brand.update({ where: { id: brandId }, data: pageFields(page) })
}

/** Snapshot per brand for the "All brands" overview. */
export async function brandOverview(userId: string) {
  const brands = await db.brand.findMany({ where: { userId }, orderBy: { createdAt: "asc" } })
  const now = new Date()
  const weekAhead = new Date(now.getTime() + 7 * 86_400_000)
  const monthAgo = new Date(now.getTime() - 30 * 86_400_000)
  return Promise.all(
    brands.map(async (brand) => {
      const [scheduled, published, failed, next] = await Promise.all([
        db.post.count({ where: { brandId: brand.id, status: "SCHEDULED", scheduledAt: { gte: now, lte: weekAhead } } }),
        db.post.findMany({ where: { brandId: brand.id, status: "PUBLISHED", publishedAt: { gte: monthAgo } } }),
        db.post.count({ where: { brandId: brand.id, status: "FAILED" } }),
        db.post.findFirst({ where: { brandId: brand.id, status: "SCHEDULED", scheduledAt: { gte: now } }, orderBy: { scheduledAt: "asc" } }),
      ])
      const reach = published.reduce((s, p) => s + (p.reach ?? p.views ?? 0), 0)
      return { brand, scheduledThisWeek: scheduled, publishedThisMonth: published.length, reach, failed, next }
    }),
  )
}
