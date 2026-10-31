import { createHash, randomBytes } from "node:crypto"
import { db } from "@/lib/db"

const hash = (token: string) => createHash("sha256").update(token).digest("hex")

/** Returns the plaintext token. It is shown once and never stored. */
export async function createApiToken(userId: string, name: string) {
  const token = `pp_${randomBytes(32).toString("base64url")}`
  await db.apiToken.create({ data: { userId, name, tokenHash: hash(token), prefix: token.slice(0, 10) } })
  return token
}

export async function userForToken(token: string) {
  const row = await db.apiToken.findUnique({ where: { tokenHash: hash(token) } })
  if (!row) return null
  // Throttle the write: lastUsedAt only needs minute precision
  if (!row.lastUsedAt || Date.now() - row.lastUsedAt.getTime() > 60_000) {
    await db.apiToken.update({ where: { id: row.id }, data: { lastUsedAt: new Date() } })
  }
  return row.userId
}
