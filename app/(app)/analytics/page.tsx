import Link from "next/link"
import { Brain, FlaskConical, ThumbsDown, ThumbsUp, Trophy } from "lucide-react"
import { requireBrand } from "@/lib/auth"
import { getAnalytics } from "@/lib/analytics"
import { latestStrategy } from "@/lib/jobs"
import { PILLARS } from "@/lib/pillars"
import { WEEKDAYS } from "@/lib/time"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { BarList, StatTile, fmtNumber, fmtPercent } from "@/components/charts"
import { PlatformIcon } from "@/components/platform-icon"
import { StrategyActions } from "@/components/strategy-actions"
import type { Bucket } from "@/lib/analytics"

export const metadata = { title: "Analytics" }

const RANGES = [30, 90, 365]

function EngagementBars({ rows }: { rows: Bucket[] }) {
  return (
    <BarList
      rows={rows.map((r) => ({ key: r.key, label: r.label, value: r.avgEngagementRate }))}
      format={fmtPercent}
      detail={(row) => {
        const b = rows.find((r) => r.key === row.key)!
        return `${b.label}: ${fmtPercent(b.avgEngagementRate)} avg engagement · ${b.posts} posts · ${fmtNumber(b.avgReach)} avg reach`
      }}
      empty="Publish posts to see results"
    />
  )
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const { brand } = await requireBrand()
  const days = RANGES.includes(Number((await searchParams).days)) ? Number((await searchParams).days) : 90
  const [a, strategy] = await Promise.all([getAnalytics(brand.id, brand.timezone, days), latestStrategy(brand.id)])
  const s = strategy?.report

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Analytics" description="What your audience responds to, and what the AI will do about it.">
        <StrategyActions canAnalyze={a.measured >= 3} />
      </PageHeader>

      <div className="mb-4 flex gap-1">
        {RANGES.map((r) => (
          <Link key={r} href={`/analytics?days=${r}`} className={`rounded-full px-3 py-1 text-sm ${r === days ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
            {r === 365 ? "1 year" : `${r} days`}
          </Link>
        ))}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Posts published" value={fmtNumber(a.published)} hint={`${a.measured} with metrics`} />
        <StatTile label="Total reach" value={fmtNumber(a.totalReach)} />
        <StatTile label="Total interactions" value={fmtNumber(a.totalInteractions)} hint="Likes, comments, shares, saves" />
        <StatTile label="Avg. engagement rate" value={a.measured ? fmtPercent(a.avgEngagementRate) : "—"} hint="Interactions ÷ reach, per post" />
      </div>

      <Card className="mb-6 border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Brain className="size-4 text-primary" /> AI strategy</CardTitle>
          <CardDescription>
            {strategy
              ? `Based on ${strategy.postCount} posts · ${strategy.createdAt.toLocaleDateString("en", { dateStyle: "medium" })} · applied automatically to new content`
              : "Run an analysis once at least 3 posts have metrics. The result steers every new plan."}
          </CardDescription>
        </CardHeader>
        {s && (
          <CardContent className="space-y-5 text-sm">
            <p className="text-base">{s.summary}</p>
            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <h3 className="mb-2 flex items-center gap-1.5 font-medium"><ThumbsUp className="size-4 text-emerald-600" /> Do more</h3>
                <ul className="list-disc space-y-1 pl-5 text-muted-foreground">{s.doMore.map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
              <div>
                <h3 className="mb-2 flex items-center gap-1.5 font-medium"><ThumbsDown className="size-4 text-red-600" /> Do less</h3>
                <ul className="list-disc space-y-1 pl-5 text-muted-foreground">{s.doLess.map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
              <div>
                <h3 className="mb-2 flex items-center gap-1.5 font-medium"><FlaskConical className="size-4 text-violet-600" /> Experiments</h3>
                <ul className="list-disc space-y-1 pl-5 text-muted-foreground">{s.experiments.map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <h3 className="mb-2 font-medium">Recommended pillar mix</h3>
                <BarList rows={s.pillarMix.map((p) => ({ key: p.pillar, label: PILLARS[p.pillar as keyof typeof PILLARS]?.label ?? p.pillar, value: p.percent / 100 }))} format={(v) => `${Math.round(v * 100)}%`} detail={(r) => `${r.label}: ${s.pillarMix.find((p) => p.pillar === r.key)?.reason}`} />
              </div>
              <div>
                <h3 className="mb-2 font-medium">Best times to post</h3>
                <ul className="space-y-1.5">
                  {s.bestTimes.map((t, i) => (
                    <li key={i} className="flex items-center gap-2"><PlatformIcon platform={t.platform} className="size-3.5" />{t.day} at {String(t.hour).padStart(2, "0")}:00</li>
                  ))}
                </ul>
                <p className="mt-2 text-muted-foreground">Cadence: {s.postsPerWeek} posts/week</p>
              </div>
              <div>
                <h3 className="mb-2 font-medium">Hashtags</h3>
                <p className="text-muted-foreground">{s.hashtagAdvice}</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Engagement by content pillar</CardTitle><CardDescription>Average engagement rate per post</CardDescription></CardHeader>
          <CardContent><EngagementBars rows={a.byPillar} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Engagement by platform</CardTitle><CardDescription>Average engagement rate per post</CardDescription></CardHeader>
          <CardContent><EngagementBars rows={a.byPlatform} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Engagement by weekday</CardTitle><CardDescription>Day the post was published ({brand.timezone})</CardDescription></CardHeader>
          <CardContent><EngagementBars rows={a.byWeekday} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Engagement by time of day</CardTitle><CardDescription>3-hour publishing windows</CardDescription></CardHeader>
          <CardContent><EngagementBars rows={a.byHour} /></CardContent>
        </Card>
      </div>

      {a.top.length > 0 && (
        <Card className="mt-6">
          <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="size-4 text-amber-500" /> Top posts</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr><th className="pb-2 font-normal">Post</th><th className="pb-2 font-normal">Pillar</th><th className="pb-2 text-right font-normal">Reach</th><th className="pb-2 text-right font-normal">Interactions</th><th className="pb-2 text-right font-normal">Eng. rate</th></tr>
              </thead>
              <tbody className="divide-y">
                {a.top.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 pr-3">
                      <Link href={`/posts/${p.id}`} className="flex items-center gap-2 hover:underline">
                        <PlatformIcon platform={p.platform} className="size-4 shrink-0" />
                        <span className="line-clamp-1">{p.hook}</span>
                      </Link>
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground">{PILLARS[p.pillar].label}</td>
                    <td className="py-2 text-right tabular-nums">{fmtNumber(p.reach ?? p.views ?? 0)}</td>
                    <td className="py-2 text-right tabular-nums">{fmtNumber(p.interactions ?? (p.likes ?? 0) + (p.comments ?? 0) + (p.shares ?? 0) + (p.saves ?? 0))}</td>
                    <td className="py-2 text-right tabular-nums">{fmtPercent(p.engagementRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
      <p className="mt-4 text-xs text-muted-foreground">Weekdays run {WEEKDAYS[1]}–{WEEKDAYS[0]}. Metrics refresh automatically every few hours for posts from the last 30 days.</p>
    </div>
  )
}
