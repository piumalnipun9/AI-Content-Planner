"use client"

import { useTransition } from "react"
import { Brain, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { analyze } from "@/app/actions/strategy"
import { syncMetrics } from "@/app/actions/meta"

export function StrategyActions({ canAnalyze }: { canAnalyze: boolean }) {
  const [syncing, startSync] = useTransition()
  const [analyzing, startAnalyze] = useTransition()
  return (
    <>
      <Button
        variant="outline"
        disabled={syncing}
        onClick={() => startSync(async () => {
          const n = await syncMetrics()
          toast.success(n ? `Updated metrics for ${n} posts` : "Metrics are already up to date")
        })}
      >
        {syncing ? <Loader2 className="animate-spin" /> : <RefreshCw />} Sync metrics
      </Button>
      <Button
        disabled={analyzing || !canAnalyze}
        title={canAnalyze ? "" : "Needs at least 3 published posts with metrics"}
        onClick={() => startAnalyze(async () => {
          const r = await analyze()
          if (r.error) toast.error(r.error)
          else toast.success("New strategy ready. It will be used for your next posts.")
        })}
      >
        {analyzing ? <Loader2 className="animate-spin" /> : <Brain />} {analyzing ? "Analysing…" : "Analyse & update strategy"}
      </Button>
    </>
  )
}
