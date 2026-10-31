"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { requireBrand } from "@/lib/auth"
import { env } from "@/lib/env"
import { createCampaign } from "@/lib/jobs"
import type { FormState } from "@/app/actions/auth"

const schema = z.object({
  name: z.string().trim().min(2, "Give the campaign a name"),
  brief: z.string().trim().min(10, "Describe what the campaign is about"),
  platforms: z.array(z.enum(["FACEBOOK", "INSTAGRAM"])).min(1, "Choose at least one platform"),
  count: z.coerce.number().int().min(1).max(30),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a start date"),
  days: z.coerce.number().int().min(1).max(60),
  schedule: z.boolean(),
})

export async function generateCampaign(_: FormState, form: FormData): Promise<FormState> {
  const { brand } = await requireBrand()
  if (!env.hasGemini()) return { error: "GEMINI_API_KEY is not set in .env" }
  const parsed = schema.safeParse({
    ...Object.fromEntries(form),
    platforms: form.getAll("platforms"),
    schedule: form.get("schedule") === "on",
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  let campaignId: string
  try {
    const campaign = await createCampaign({ brand, ...parsed.data })
    campaignId = campaign.id
  } catch (e) {
    console.error("[campaign]", e)
    return { error: `Generation failed: ${(e as Error).message}` }
  }
  redirect(`/posts?campaign=${campaignId}`)
}
