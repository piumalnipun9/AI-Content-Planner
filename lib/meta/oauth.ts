import { env } from "@/lib/env"
import { db } from "@/lib/db"
import type { Prisma } from "@/lib/generated/prisma/client"
import { graphGet } from "@/lib/meta/graph"

/** Permissions to select in the Facebook Login for Business configuration (or requested directly as a scope). */
export const META_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "read_insights",
  "business_management",
  "instagram_basic",
  "instagram_content_publish",
  "instagram_manage_insights",
]

export const redirectUri = () => `${env.appUrl()}/api/meta/callback`

export function authorizeUrl(state: string) {
  const configId = env.metaConfigId()
  const scopes = process.env.META_SCOPES?.split(",").map((x) => x.trim()).filter(Boolean) ?? META_SCOPES
  const params = new URLSearchParams({
    client_id: env.metaAppId(),
    redirect_uri: redirectUri(),
    state,
    response_type: "code",
    // Facebook Login for Business selects permissions through a configuration instead of `scope`
    ...(configId ? { config_id: configId } : { scope: scopes.join(",") }),
  })
  return `https://www.facebook.com/${env.graphVersion()}/dialog/oauth?${params}`
}

export interface PageOption {
  id: string
  name: string
  accessToken: string
  igUserId?: string
  igUsername?: string
}

/** Code -> short-lived token -> long-lived (~60 day) user token. Page tokens derived from it don't expire. */
export async function exchangeCode(code: string) {
  const short = await graphGet<{ access_token: string }>("oauth/access_token", {
    client_id: env.metaAppId(),
    client_secret: env.metaAppSecret(),
    redirect_uri: redirectUri(),
    code,
  })
  const long = await graphGet<{ access_token: string; expires_in?: number }>("oauth/access_token", {
    grant_type: "fb_exchange_token",
    client_id: env.metaAppId(),
    client_secret: env.metaAppSecret(),
    fb_exchange_token: short.access_token,
  })
  return {
    token: long.access_token,
    expiresAt: long.expires_in ? new Date(Date.now() + long.expires_in * 1000) : null,
  }
}

export async function listPages(userToken: string): Promise<PageOption[]> {
  type RawPage = { id: string; name: string; access_token: string; instagram_business_account?: { id: string; username?: string } }
  const res = await graphGet<{ data: RawPage[] }>("me/accounts", {
    fields: "id,name,access_token,instagram_business_account{id,username}",
    limit: 100,
    access_token: userToken,
  })
  return res.data.map((p) => ({
    id: p.id,
    name: p.name,
    accessToken: p.access_token,
    igUserId: p.instagram_business_account?.id,
    igUsername: p.instagram_business_account?.username,
  }))
}

/**
 * Store the login and the Pages it can manage, refresh the Page tokens of brands already linked to
 * those Pages, and link the obvious case automatically (one unlinked brand, one unlinked Page).
 */
export async function saveConnection(userId: string, token: string, expiresAt: Date | null, pages: PageOption[]) {
  const data = { userAccessToken: token, tokenExpiresAt: expiresAt, availablePages: pages as unknown as Prisma.InputJsonValue }
  await db.metaConnection.upsert({ where: { userId }, create: { userId, ...data }, update: { ...data, connectedAt: new Date() } })

  const brands = await db.brand.findMany({ where: { userId } })
  for (const brand of brands) {
    const page = pages.find((p) => p.id === brand.pageId)
    if (page) await db.brand.update({ where: { id: brand.id }, data: pageFields(page) })
  }

  const linked = new Set(brands.map((b) => b.pageId).filter(Boolean))
  const unlinkedPages = pages.filter((p) => !linked.has(p.id))
  const unlinkedBrands = brands.filter((b) => !b.pageId)
  if (unlinkedBrands.length === 1 && unlinkedPages.length === 1) {
    await db.brand.update({ where: { id: unlinkedBrands[0].id }, data: pageFields(unlinkedPages[0]) })
    unlinkedPages.pop()
  }
  return { pages, unlinkedPages }
}

/** Brand columns for a linked Page (null fields unlink it). */
export function pageFields(page?: PageOption | null) {
  return {
    pageId: page?.id ?? null,
    pageName: page?.name ?? null,
    pageAccessToken: page?.accessToken ?? null,
    igUserId: page?.igUserId ?? null,
    igUsername: page?.igUsername ?? null,
  }
}

export async function availablePages(userId: string) {
  const conn = await db.metaConnection.findUnique({ where: { userId } })
  return (conn?.availablePages as unknown as PageOption[] | undefined) ?? []
}
