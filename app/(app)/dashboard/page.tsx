import Link from "next/link"
import { ArrowRight, CheckCircle2, Circle, Lightbulb, Sparkles } from "lucide-react"
import { requireBrand } from "@/lib/auth"
import { db } from "@/lib/db"
import { env } from "@/lib/env"
import { getAnalytics } from "@/lib/analytics"
import { latestStrategy } from "@/lib/jobs"
import { formatInZone } from "@/lib/time"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { StatTile, fmtNumber, fmtPercent } from "@/components/charts"
import { PlatformIcon } from "@/components/platform-icon"
import { StatusBadge } from "@/components/status-badge"
import { PostCard } from "@/components/post-card"
import { AutoRefresh } from "@/components/auto-refresh"

export const metadata = { title: "Dashboard" }

export default async function DashboardPage() {
  const { user, brand } = await requireBrand()
  const now = new Date()
  const [upcoming, recent, postCount, analytics, strategy] = await Promise.all([
    db.post.findMany({
      where: { brandId: brand.id, status: { in: ["SCHEDULED", "PUBLISHING", "FAILED"] } },
      orderBy: { scheduledAt: "asc" },
      take: 6,
    }),
    db.post.findMany({ where: { brandId: brand.id, status: "PUBLISHED" }, orderBy: { publishedAt: "desc" }, take: 4 }),
    db.post.count({ where: { brandId: brand.id } }),
    getAnalytics(brand.id, brand.timezone, 30),
    latestStrategy(brand.id),
  ])
  const scheduledThisWeek = await db.post.count({
    where: { brandId: brand.id, status: "SCHEDULED", scheduledAt: { gte: now, lte: new Date(now.getTime() + 7 * 86_400_000) } },
  })

  const checklist = [
    { done: env.hasGemini(), label: "Add GEMINI_API_KEY to .env", href: "/settings" },
    { done: Boolean(brand.pageId), label: `Link a Facebook Page to ${brand.name}`, href: "/settings" },
    { done: Boolean(brand.igUserId), label: "Link an Instagram Business account to that Page", href: "/settings" },
    { done: postCount > 0, label: "Generate your first content plan", href: "/create" },
    { done: analytics.published > 0, label: "Publish a post", href: "/posts" },
  ]
  const setupDone = checklist.every((c) => c.done)

  return (
    <div className="mx-auto max-w-6xl">
      <AutoRefresh active={upcoming.some((p) => p.status === "PUBLISHING")} />
      <PageHeader title={`Hi ${user.name.split(" ")[0]}`} description={`Here's how ${brand.name} is doing on social.`}>
        <Link href="/create" className={buttonVariants({ size: "lg" })}>
          <Sparkles /> Create content
        </Link>
      </PageHeader>

      {!setupDone && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Get set up</CardTitle>
            <CardDescription>A few steps until Postpilot can run your social media on its own.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {checklist.map((c) => (
                <li key={c.label}>
                  <Link href={c.href} className="flex items-center gap-2 rounded-lg p-2 text-sm hover:bg-muted">
                    {c.done ? <CheckCircle2 className="size-4 text-emerald-600" /> : <Circle className="size-4 text-muted-foreground" />}
                    <span className={c.done ? "text-muted-foreground line-through" : ""}>{c.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Published (30 days)" value={fmtNumber(analytics.published)} />
        <StatTile label="Reach (30 days)" value={fmtNumber(analytics.totalReach)} hint={`${analytics.measured} posts measured`} />
        <StatTile label="Avg. engagement rate" value={analytics.measured ? fmtPercent(analytics.avgEngagementRate) : "—"} hint="Interactions ÷ reach" />
        <StatTile label="Scheduled next 7 days" value={String(scheduledThisWeek)} hint={`Target ${brand.postsPerWeek}/week`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Up next</CardTitle>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nothing scheduled. <Link href="/create" className="text-primary hover:underline">Generate a plan</Link>
                {" "}or turn on autopilot in Settings.
              </p>
            ) : (
              <ul className="divide-y">
                {upcoming.map((p) => (
                  <li key={p.id}>
                    <Link href={`/posts/${p.id}`} className="flex items-center gap-3 py-2.5 hover:opacity-80">
                      <PlatformIcon platform={p.platform} className="size-5 shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{p.hook}</span>
                        <span className="text-xs text-muted-foreground">{p.scheduledAt ? formatInZone(p.scheduledAt, brand.timezone) : "—"}</span>
                      </span>
                      <StatusBadge status={p.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lightbulb className="size-4 text-amber-500" /> Strategy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {strategy ? (
              <>
                <p>{strategy.report.summary}</p>
                <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                  {strategy.report.doMore.slice(0, 3).map((d) => <li key={d}>{d}</li>)}
                </ul>
              </>
            ) : (
              <p className="text-muted-foreground">
                Once a few posts have results, the AI strategist analyses what works and feeds it into every new plan.
              </p>
            )}
            <Link href="/analytics" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
              Open analytics <ArrowRight className="size-3.5" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {recent.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-medium">Recently published</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {recent.map((p) => <PostCard key={p.id} post={p} timeZone={brand.timezone} />)}
          </div>
        </section>
      )}
    </div>
  )
}
