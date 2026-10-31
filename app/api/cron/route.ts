import type { NextRequest } from "next/server"
import { publishDuePosts, processImageQueue, refreshMetrics, runAutopilot } from "@/lib/jobs"

/**
 * For hosts without a long-running process (e.g. Vercel Cron): call every few minutes with
 * `Authorization: Bearer $CRON_SECRET`. Self-hosted servers run these jobs automatically.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  const published = await publishDuePosts()
  await processImageQueue()
  const measured = await refreshMetrics()
  if (request.nextUrl.searchParams.get("autopilot") !== "0") await runAutopilot()
  return Response.json({ published, measured })
}
