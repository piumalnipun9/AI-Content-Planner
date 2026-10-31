import { after } from "next/server"

/**
 * Run work after the response is sent. Inside a request this uses after(), so serverless hosts keep the
 * function alive until it finishes; outside one (the in-process scheduler) it simply runs detached.
 */
export function inBackground(job: () => Promise<unknown>) {
  const run = () => job().catch((e) => console.error("[background]", e))
  try {
    after(run)
  } catch {
    void run()
  }
}
