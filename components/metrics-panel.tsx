"use client"

import { useTransition } from "react"
import { ExternalLink, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import type { Post } from "@/lib/generated/prisma/client"
import { Button } from "@/components/ui/button"
import { fmtNumber, fmtPercent } from "@/components/charts"
import { refreshMetricsFor } from "@/app/actions/posts"

export function MetricsPanel({ post, engagementRate }: { post: Post; engagementRate: number }) {
  const [pending, start] = useTransition()
  const rows = [
    ["Reach", post.reach],
    ["Views", post.views],
    ["Likes / reactions", post.likes],
    ["Comments", post.comments],
    ["Shares", post.shares],
    ["Saves", post.saves],
  ] as const
  return (
    <div className="space-y-4">
      {post.metricsUpdatedAt ? (
        <>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-sm text-muted-foreground">Engagement rate</p>
            <p className="text-2xl font-semibold">{fmtPercent(engagementRate)}</p>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {rows.map(([label, v]) => (
              <div key={label} className="flex justify-between border-b py-1">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="tabular-nums">{v === null ? "—" : fmtNumber(v)}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-muted-foreground">Updated {post.metricsUpdatedAt.toLocaleString()}</p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Metrics appear a few minutes after publishing and refresh automatically every few hours.</p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => start(async () => {
            const r = await refreshMetricsFor(post.id)
            if (r?.error) toast.error(r.error)
            else toast.success("Metrics updated")
          })}
        >
          {pending ? <Loader2 className="animate-spin" /> : <RefreshCw />} Refresh metrics
        </Button>
        {post.permalink && (
          <a href={post.permalink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            View post <ExternalLink className="size-3.5" />
          </a>
        )}
      </div>
    </div>
  )
}
