import type { Pillar } from "@/lib/generated/prisma/enums"

export const PILLARS: Record<Pillar, { label: string; description: string }> = {
  EDUCATIONAL: { label: "Educational", description: "Tips, how-tos and insights that teach the audience something useful" },
  PROMOTIONAL: { label: "Promotional", description: "Products, offers and launches with a clear call to action" },
  ENGAGEMENT: { label: "Engagement", description: "Questions, polls and conversation starters that invite comments" },
  BEHIND_THE_SCENES: { label: "Behind the scenes", description: "The people, process and story behind the brand" },
  SOCIAL_PROOF: { label: "Social proof", description: "Testimonials, reviews, results and customer stories" },
  INSPIRATIONAL: { label: "Inspirational", description: "Motivation, values and aspirational moments tied to the brand" },
}

export const PILLAR_KEYS = Object.keys(PILLARS) as Pillar[]
