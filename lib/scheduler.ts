import { publishDuePosts, processImageQueue, refreshMetrics, runAutopilot } from "@/lib/jobs"

const MINUTE = 60_000
const g = globalThis as unknown as { __schedulerStarted?: boolean }

function every(ms: number, name: string, job: () => Promise<unknown>) {
  let running = false
  const tick = async () => {
    if (running) return
    running = true
    try {
      await job()
    } catch (e) {
      console.error(`[scheduler] ${name} failed:`, e)
    } finally {
      running = false
    }
  }
  setInterval(tick, ms).unref()
  setTimeout(tick, 5_000).unref()
}

/** In-process scheduler for self-hosted / long-running servers. Serverless hosts should call /api/cron instead. */
export function startScheduler() {
  if (g.__schedulerStarted) return
  g.__schedulerStarted = true
  every(MINUTE, "publish", publishDuePosts)
  every(MINUTE, "images", processImageQueue)
  every(30 * MINUTE, "metrics", () => refreshMetrics())
  every(60 * MINUTE, "autopilot", runAutopilot)
  console.log("[scheduler] started")
}
