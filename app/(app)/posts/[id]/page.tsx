import Link from "next/link"
import { notFound } from "next/navigation"
import { AlertTriangle, ArrowLeft } from "lucide-react"
import { requireBrand } from "@/lib/auth"
import { db } from "@/lib/db"
import { engagementRate } from "@/lib/analytics"
import { PILLARS } from "@/lib/pillars"
import { formatInZone, isDueWithinMinutes, toLocalInput } from "@/lib/time"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PostImage } from "@/components/post-image"
import { PlatformIcon, platformName } from "@/components/platform-icon"
import { StatusBadge } from "@/components/status-badge"
import { PostEditor } from "@/components/post-editor"
import { MetricsPanel } from "@/components/metrics-panel"
import { AutoRefresh } from "@/components/auto-refresh"

export const metadata = { title: "Post" }

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user } = await requireBrand()
  const post = await db.post.findFirst({ where: { id, userId: user.id }, include: { campaign: true, brand: true } })
  if (!post) notFound()
  // A post is shown in its own brand's context, even if another brand is active
  const brand = post.brand

  const canPublish = Boolean(brand.pageAccessToken && (post.platform === "FACEBOOK" || (brand.igUserId && post.imageState === "READY")))
  const busy =
    post.imageState === "PENDING" ||
    post.imageState === "GENERATING" ||
    post.status === "PUBLISHING" ||
    (post.status === "SCHEDULED" && isDueWithinMinutes(post.scheduledAt, 10))

  return (
    <div className="mx-auto max-w-6xl">
      <AutoRefresh active={busy} />
      <Link href={post.campaignId ? `/posts?campaign=${post.campaignId}` : "/posts"} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {post.campaign?.name ?? "Posts"}
      </Link>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <PlatformIcon platform={post.platform} className="size-6" />
        <h1 className="min-w-0 flex-1 text-xl font-semibold tracking-tight">{post.hook}</h1>
        <StatusBadge status={post.status} />
      </div>

      {post.error && (post.status === "FAILED" || post.imageState === "FAILED") && (
        <div className="mb-6 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {post.error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border bg-card">
            <PostImage post={post} />
          </div>
          <Card>
            <CardContent className="space-y-1 pt-4 text-sm">
              <p><span className="text-muted-foreground">Platform:</span> {platformName(post.platform)}</p>
              <p><span className="text-muted-foreground">Pillar:</span> {PILLARS[post.pillar].label}</p>
              {post.scheduledAt && <p><span className="text-muted-foreground">Scheduled:</span> {formatInZone(post.scheduledAt, brand.timezone)}</p>}
              {post.publishedAt && <p><span className="text-muted-foreground">Published:</span> {formatInZone(post.publishedAt, brand.timezone)}</p>}
              <p className="text-xs text-muted-foreground">Times shown in {brand.timezone}</p>
            </CardContent>
          </Card>
          {post.status === "PUBLISHED" && (
            <Card>
              <CardHeader><CardTitle>Performance</CardTitle></CardHeader>
              <CardContent><MetricsPanel post={post} engagementRate={engagementRate(post)} /></CardContent>
            </Card>
          )}
        </div>
        <Card>
          <CardContent className="pt-6">
            <PostEditor
              key={post.status}
              post={post}
              localScheduled={post.scheduledAt ? toLocalInput(post.scheduledAt, brand.timezone) : ""}
              canPublish={canPublish}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
