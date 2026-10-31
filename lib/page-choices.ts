import { db } from "@/lib/db"
import { availablePages } from "@/lib/meta/oauth"
import type { PageChoice } from "@/components/brand-form"

/** Connected Pages for the brand form's picker, marking ones already linked to other brands. */
export async function pageChoices(userId: string, forBrandId?: string): Promise<PageChoice[]> {
  const [pages, brands] = await Promise.all([availablePages(userId), db.brand.findMany({ where: { userId }, select: { id: true, name: true, pageId: true } })])
  return pages.map((p) => ({
    id: p.id,
    name: p.name,
    igUsername: p.igUsername,
    usedBy: brands.find((b) => b.pageId === p.id && b.id !== forBrandId)?.name,
  }))
}
