"use server"

import { revalidatePath } from "next/cache"
import { requireBrand } from "@/lib/auth"
import { env } from "@/lib/env"
import { runStrategy } from "@/lib/jobs"

export async function analyze(): Promise<{ error?: string }> {
  const { brand } = await requireBrand()
  if (!env.hasGemini()) return { error: "GEMINI_API_KEY is not set in .env" }
  try {
    await runStrategy(brand)
  } catch (e) {
    return { error: (e as Error).message }
  }
  revalidatePath("/analytics")
  revalidatePath("/dashboard")
  return {}
}
