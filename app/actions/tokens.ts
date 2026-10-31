"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireUser } from "@/lib/auth"
import { createApiToken } from "@/lib/api-tokens"

export async function createToken(name: string): Promise<{ token?: string; error?: string }> {
  const user = await requireUser()
  const label = name.trim() || "Agent"
  if (label.length > 60) return { error: "Name is too long" }
  const token = await createApiToken(user.id, label)
  revalidatePath("/settings")
  return { token }
}

export async function revokeToken(id: string) {
  const user = await requireUser()
  await db.apiToken.deleteMany({ where: { id, userId: user.id } })
  revalidatePath("/settings")
}
