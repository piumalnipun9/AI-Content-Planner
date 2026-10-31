import { z } from "zod"

const text = (label: string, min = 2) => z.string().trim().min(min, `${label} is required`)

export const brandSchema = z.object({
  name: text("Brand name"),
  industry: text("Industry"),
  description: text("Description", 20),
  offerings: text("Products / services", 5),
  audience: text("Target audience", 5),
  tone: text("Tone of voice"),
  goals: text("Goals", 5),
  website: z.string().trim().nullish().transform((v) => v || null),
  language: text("Language"),
  visualStyle: text("Visual style"),
  timezone: z.string().refine((tz) => Intl.supportedValuesOf("timeZone").includes(tz) || tz === "UTC", "Unknown timezone"),
  postsPerWeek: z.coerce.number().int().min(1).max(21),
})
