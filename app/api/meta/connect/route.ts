import { randomBytes } from "node:crypto"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getUser } from "@/lib/auth"
import { env } from "@/lib/env"
import { authorizeUrl } from "@/lib/meta/oauth"

export async function GET() {
  const user = await getUser()
  if (!user) redirect("/login")
  if (!env.hasMeta()) redirect("/settings?meta=missing_app")

  const state = randomBytes(16).toString("hex")
  ;(await cookies()).set("meta_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/meta",
    maxAge: 600,
  })
  redirect(authorizeUrl(state))
}
