import Link from "next/link"
import { Sparkles } from "lucide-react"
import { requireBrand } from "@/lib/auth"
import { db } from "@/lib/db"
import type { PostStatus } from "@/lib/generated/prisma/enums"
import { buttonVariants } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { PostCard } from "@/components/post-card"
import { AutoRefresh } from "@/components/auto-refresh"

export const metadata = { title: "Posts" }

const FILTERS: { key: string; label: string; statuses?: PostStatus[] }[] = [
  { key: "all", label: "All" },
  { key: "drafts", label: "Drafts", statuses: ["DRAFT"] },
  { key: "scheduled", label: "Scheduled", statuses: ["SCHEDULED", "PUBLISHING"] },
  { key: "published", label: "Published", statuses: ["PUBLISHED"] },
  { key: "failed", label: "Failed", statuses: ["FAILED"] },
]

export default async function PostsPage({ searchParams }: { searchParams: Promise<{ filter?: string; campaign?: string }> }) {
  const { brand } = await requireBrand()
  const { filter = "all", campaign: campaignId } = await searchParams
  const active = FILTERS.find((f) => f.key === filter) ?? FILTERS[0]

  const [posts, campaign, counts] = await Promise.all([
    db.post.findMany({
      where: { brandId: brand.id, ...(active.statuses ? { status: { in: active.statuses } } : {}), ...(campaignId ? { campaignId } : {}) },
      orderBy: [{ scheduledAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
      take: 120,
    }),
    campaignId ? db.campaign.findFirst({ where: { id: campaignId, brandId: brand.id } }) : null,
    db.post.groupBy({ by: ["status"], where: { brandId: brand.id, ...(campaignId ? { campaignId } : {}) }, _count: true }),
  ])
  const countFor = (f: (typeof FILTERS)[number]) =>
    counts.filter((c) => !f.statuses || f.statuses.includes(c.status)).reduce((s, c) => s + c._count, 0)
  const qs = (key: string) => `/posts?filter=${key}${campaignId ? `&campaign=${campaignId}` : ""}`
  const busy = posts.some((p) => p.imageState === "PENDING" || p.imageState === "GENERATING" || p.status === "PUBLISHING")

  return (
    <div className="mx-auto max-w-6xl">
      <AutoRefresh active={busy} />
      <PageHeader
        title={campaign ? campaign.name : "Posts"}
        description={campaign ? campaign.brief : "Everything you've created, scheduled and published."}
      >
        {campaign && <Link href="/posts" className={buttonVariants({ variant: "outline" })}>All posts</Link>}
        <Link href="/create" className={buttonVariants()}><Sparkles /> Create</Link>
      </PageHeader>

      {campaign && posts.some((p) => p.status === "DRAFT") && (
        <p className="mb-4 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
          Your plan is ready. Images are generated in the background. Open each post to review it, then schedule or publish.
        </p>
      )}

      <div className="mb-5 flex gap-1 overflow-x-auto border-b">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={qs(f.key)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm whitespace-nowrap ${f.key === active.key ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {f.label} <span className="text-muted-foreground">{countFor(f)}</span>
          </Link>
        ))}
      </div>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          No posts here yet. <Link href="/create" className="text-primary hover:underline">Generate a content plan</Link>.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {posts.map((p) => <PostCard key={p.id} post={p} timeZone={brand.timezone} />)}
        </div>
      )}
    </div>
  )
}
