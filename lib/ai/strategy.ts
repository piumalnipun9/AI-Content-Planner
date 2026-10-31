import { z } from "zod"
import type { Brand } from "@/lib/generated/prisma/client"
import { generateJson } from "@/lib/ai/gemini"
import { brandContext } from "@/lib/ai/content"
import { PILLAR_KEYS } from "@/lib/pillars"
import type { Analytics, ScoredPost } from "@/lib/analytics"

const strategySchema = z.object({
  summary: z.string().describe("2-3 sentence plain-language summary of performance"),
  wins: z.array(z.string()).describe("What is working, with evidence from the data"),
  doMore: z.array(z.string()),
  doLess: z.array(z.string()),
  experiments: z.array(z.string()).describe("Concrete tests to run in the next 2 weeks"),
  pillarMix: z.array(z.object({ pillar: z.enum(PILLAR_KEYS as [string, ...string[]]), percent: z.number(), reason: z.string() })),
  bestTimes: z.array(z.object({ platform: z.enum(["FACEBOOK", "INSTAGRAM"]), day: z.string(), hour: z.number().int().min(0).max(23) })),
  hashtagAdvice: z.string(),
  postsPerWeek: z.number().int().min(1).max(21),
})
export type StrategyReport = z.infer<typeof strategySchema>

function describePost(p: ScoredPost) {
  return `[${p.platform}, ${p.pillar}, published ${p.publishedAt?.toISOString()}] reach=${p.reach ?? p.views ?? "?"} likes=${p.likes ?? 0} comments=${p.comments ?? 0} shares=${p.shares ?? 0} saves=${p.saves ?? 0} ER=${(p.engagementRate * 100).toFixed(2)}%
Caption: ${p.caption.slice(0, 300)}
Hashtags: ${p.hashtags.map((h) => "#" + h).join(" ")}`
}

export async function analyzeStrategy(brand: Brand, a: Analytics): Promise<StrategyReport> {
  const table = (title: string, rows: Analytics["byPillar"]) =>
    `${title}\n${rows.map((r) => `- ${r.label}: ${r.posts} posts, avg ER ${(r.avgEngagementRate * 100).toFixed(2)}%, avg reach ${Math.round(r.avgReach)}`).join("\n") || "- no data"}`

  const prompt = `${brandContext(brand)}
Current cadence: ${brand.postsPerWeek} posts/week. Timezone for times below: ${brand.timezone}.

PERFORMANCE (last 90 days)
Published posts: ${a.published}, with metrics: ${a.measured}
Total reach: ${a.totalReach}, total interactions: ${a.totalInteractions}, average engagement rate: ${(a.avgEngagementRate * 100).toFixed(2)}%

${table("BY PILLAR", a.byPillar)}

${table("BY PLATFORM", a.byPlatform)}

${table("BY WEEKDAY", a.byWeekday)}

${table("BY TIME OF DAY", a.byHour)}

TOP POSTS
${a.top.map(describePost).join("\n\n")}

WEAKEST POSTS
${a.bottom.map(describePost).join("\n\n") || "n/a"}

TASK
Act as the brand's social media strategist. Explain what drives engagement for this audience and give a concrete plan for the next weeks.
Base every claim on the numbers above. When the sample is small (under ~15 posts), say so and keep recommendations tentative.
pillarMix percentages must sum to 100. bestTimes: 2-4 slots per platform in use.`

  const report = await generateJson(strategySchema, prompt)
  const total = report.pillarMix.reduce((s, p) => s + p.percent, 0) || 1
  report.pillarMix = report.pillarMix.map((p) => ({ ...p, percent: Math.round((p.percent / total) * 100) }))
  return report
}
