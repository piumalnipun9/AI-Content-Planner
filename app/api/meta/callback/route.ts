import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import type { NextRequest } from "next/server"
import { getUser } from "@/lib/auth"
import { exchangeCode, listPages, saveConnection } from "@/lib/meta/oauth"

export async function GET(request: NextRequest) {
  const user = await getUser()
  if (!user) redirect("/login")

  const params = request.nextUrl.searchParams
  const store = await cookies()
  const expected = store.get("meta_oauth_state")?.value
  store.delete({ name: "meta_oauth_state", path: "/api/meta" })

  if (params.get("error")) redirect(`/settings?meta=denied`)
  const code = params.get("code")
  if (!code || !expected || params.get("state") !== expected) redirect("/settings?meta=invalid_state")

  let outcome: string
  try {
    const { token, expiresAt } = await exchangeCode(code)
    const pages = await listPages(token)
    const { unlinkedPages } = await saveConnection(user.id, token, expiresAt, pages)
    outcome = pages.length === 0 ? "no_pages" : unlinkedPages.length ? "new_pages" : "connected"
  } catch (e) {
    console.error("[meta] callback failed:", e)
    outcome = "error"
  }
  redirect(`/settings?meta=${outcome}`)
}
