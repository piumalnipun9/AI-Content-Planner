import { z } from "zod"
import type { Brand, Platform } from "@/lib/generated/prisma/client"
import { generateJson } from "@/lib/ai/gemini"
import { PILLARS, PILLAR_KEYS } from "@/lib/pillars"
import type { StrategyReport } from "@/lib/ai/strategy"

const plannedPost = z.object({
  platform: z.enum(["FACEBOOK", "INSTAGRAM"]),
  pillar: z.enum(PILLAR_KEYS as [string, ...string[]]),
  dayIndex: z.number().int().describe("0-based day within the campaign window"),
  hour: z.number().int().min(0).max(23).describe("Local posting hour, 24h clock"),
  hook: z.string().describe("The scroll-stopping first line"),
  caption: z.string().describe("Full caption including the hook as its first line, without hashtags"),
  hashtags: z.array(z.string()).describe("Hashtags without the # symbol"),
  imagePrompt: z.string().describe("Detailed prompt for an image generator describing the post visual"),
})

const planSchema = z.object({ posts: z.array(plannedPost) })
type PlannedPost = z.infer<typeof plannedPost>

export function brandContext(brand: Brand) {
  return `BRAND
Name: ${brand.name}
Industry: ${brand.industry}
About: ${brand.description}
Offerings: ${brand.offerings}
Target audience: ${brand.audience}
Voice and tone: ${brand.tone}
Marketing goals: ${brand.goals}
Visual style: ${brand.visualStyle}
${brand.website ? `Website: ${brand.website}\n` : ""}Write in: ${brand.language}`
}

interface PlanInput {
  brand: Brand
  brief: string
  platforms: Platform[]
  count: number
  days: number
  strategy?: StrategyReport | null
  /** Captions of the best performing past posts, used as style references */
  winners?: { caption: string; pillar: string; platform: string; engagementRate: number }[]
}

const SYSTEM = `You are a senior social media strategist and copywriter for small and medium businesses.
You plan and write Facebook and Instagram posts that are specific to the brand, never generic.
Rules:
- Facebook: conversational, 40-120 words, may include a link or question, at most 3 hashtags.
- Instagram: strong hook in the first line, short paragraphs with line breaks, clear call to action, 8-15 relevant hashtags mixing broad and niche.
- Never invent prices, discounts, statistics or claims that are not in the brand information or brief.
- Vary hooks, formats and pillars across the plan. No two posts should open the same way.
- Image prompts describe a single striking photo or graphic in the brand's visual style, portrait 4:5. Avoid text in images unless it is 1-4 words.`

export async function planPosts(input: PlanInput): Promise<PlannedPost[]> {
  const pillarGuide = Object.entries(PILLARS)
    .map(([key, p]) => `- ${key}: ${p.description}`)
    .join("\n")

  const strategy = input.strategy
    ? `CURRENT STRATEGY (from analysis of past results - follow it)
Summary: ${input.strategy.summary}
Do more of: ${input.strategy.doMore.join("; ")}
Do less of: ${input.strategy.doLess.join("; ")}
Recommended pillar mix: ${input.strategy.pillarMix.map((p) => `${p.pillar} ${p.percent}%`).join(", ")}
Best posting times: ${input.strategy.bestTimes.map((t) => `${t.platform} ${t.day} ${t.hour}:00`).join(", ")}
Hashtag advice: ${input.strategy.hashtagAdvice}`
    : "No performance data yet. Use a balanced pillar mix and typical high-engagement times for the audience."

  const winners = input.winners?.length
    ? `TOP PERFORMING PAST POSTS (learn from their style, do not copy)\n${input.winners
        .map((w, i) => `${i + 1}. [${w.platform}, ${w.pillar}, ${(w.engagementRate * 100).toFixed(1)}% engagement] ${w.caption.slice(0, 400)}`)
        .join("\n")}`
    : ""

  const prompt = `${brandContext(input.brand)}

CONTENT PILLARS
${pillarGuide}

${strategy}

${winners}

TASK
Campaign brief: ${input.brief}
Create exactly ${input.count} posts spread across ${input.days} days (dayIndex 0 to ${input.days - 1}).
Platforms to use: ${input.platforms.join(", ")}. Distribute posts between them.
Spread posts over different days where possible.`

  const { posts } = await generateJson(planSchema, prompt, SYSTEM)
  return posts.slice(0, input.count).map((p) => ({
    ...p,
    platform: input.platforms.includes(p.platform as Platform) ? p.platform : input.platforms[0],
    dayIndex: Math.min(Math.max(p.dayIndex, 0), input.days - 1),
    hashtags: p.hashtags.map((h) => h.replace(/^#/, "").replace(/\s+/g, "")).filter(Boolean),
  }))
}

const rewriteSchema = z.object({ hook: z.string(), caption: z.string(), hashtags: z.array(z.string()) })

export async function rewriteCaption(brand: Brand, post: { platform: string; pillar: string; caption: string }, instruction: string) {
  const prompt = `${brandContext(brand)}

Rewrite this ${post.platform} post (${post.pillar} pillar).
Instruction: ${instruction || "Make it more engaging while keeping the message."}

CURRENT CAPTION
${post.caption}`
  const result = await generateJson(rewriteSchema, prompt, SYSTEM)
  return { ...result, hashtags: result.hashtags.map((h) => h.replace(/^#/, "")) }
}

export function imagePromptFor(brand: Brand, imagePrompt: string) {
  return `${imagePrompt}

Style: ${brand.visualStyle}. Brand: ${brand.name} (${brand.industry}).
Portrait 4:5 composition for a social media feed, high quality, no watermarks, no logos of other brands.`
}
