// Serverless hosts (Vercel) have no long-running process: /api/cron runs the jobs there instead.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.DISABLE_SCHEDULER !== "1" && !process.env.VERCEL) {
    const { startScheduler } = await import("./lib/scheduler")
    startScheduler()
  }
}
