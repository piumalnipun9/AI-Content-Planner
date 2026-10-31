import "server-only"
import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"
import { env } from "@/lib/env"

const COOKIE = "session"
const MAX_AGE = 60 * 60 * 24 * 30

const key = () => new TextEncoder().encode(env.sessionSecret())

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(key())
  const store = await cookies()
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  })
}

export async function readSession(): Promise<string | null> {
  const token = (await cookies()).get(COOKIE)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, key())
    return typeof payload.sub === "string" ? payload.sub : null
  } catch {
    return null
  }
}

export async function deleteSession() {
  ;(await cookies()).delete(COOKIE)
}
