import { env } from "@/lib/env"

export class GraphError extends Error {
  constructor(message: string, public code?: number, public subcode?: number) {
    super(message)
  }
  /** Token expired, revoked or missing permissions: the user has to reconnect. */
  get needsReconnect() {
    return this.code === 190 || this.code === 10 || (this.code !== undefined && this.code >= 200 && this.code < 300)
  }
}

type Params = Record<string, string | number | boolean | undefined>

function toSearch(params: Params) {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v !== undefined) sp.set(k, String(v))
  return sp
}

async function handle<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.error) {
    const e = data.error ?? {}
    throw new GraphError(e.error_user_msg || e.message || `Graph API HTTP ${res.status}`, e.code, e.error_subcode)
  }
  return data as T
}

const base = () => `${env.graphBaseUrl()}/${env.graphVersion()}`

export async function graphGet<T = unknown>(path: string, params: Params) {
  return handle<T>(await fetch(`${base()}/${path}?${toSearch(params)}`, { cache: "no-store" }))
}

export async function graphPost<T = unknown>(path: string, params: Params) {
  return handle<T>(
    await fetch(`${base()}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: toSearch(params),
      cache: "no-store",
    }),
  )
}

export async function graphDelete<T = unknown>(path: string, params: Params) {
  return handle<T>(await fetch(`${base()}/${path}?${toSearch(params)}`, { method: "DELETE", cache: "no-store" }))
}
