import Link from "next/link"
import { Heart, MessageCircle, Eye } from "lucide-react"
import type { Post } from "@/lib/generated/prisma/client"
import { PlatformIcon } from "@/components/platform-icon"
import { StatusBadge } from "@/components/status-badge"
import { PostImage } from "@/components/post-image"
import { fmtNumber } from "@/components/charts"
import { PILLARS } from "@/lib/pillars"
import { formatInZone } from "@/lib/time"

export function PostCard({ post, timeZone }: { post: Post; timeZone: string }) {
  const when = post.publishedAt ?? post.scheduledAt
  return (
    <Link href={`/posts/${post.id}`} className="group overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md">
      <div className="relative">
        <PostImage post={post} />
        <div className="absolute top-2 left-2 rounded-full bg-white/90 p-1 shadow-sm">
          <PlatformIcon platform={post.platform} />
        </div>
      </div>
      <div className="space-y-2 p-3">
        <div className="flex items-center justify-between gap-2">
          <StatusBadge status={post.status} />
          <span className="text-xs text-muted-foreground">{PILLARS[post.pillar].label}</span>
        </div>
        <p className="line-clamp-2 text-sm font-medium">{post.hook}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{when ? formatInZone(when, timeZone, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Not scheduled"}</span>
          {post.metricsUpdatedAt && (
            <span className="flex items-center gap-2">
              <span className="flex items-center gap-0.5"><Eye className="size-3" />{fmtNumber(post.reach ?? post.views ?? 0)}</span>
              <span className="flex items-center gap-0.5"><Heart className="size-3" />{fmtNumber(post.likes ?? 0)}</span>
              <span className="flex items-center gap-0.5"><MessageCircle className="size-3" />{fmtNumber(post.comments ?? 0)}</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
