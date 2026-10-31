"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/** Re-fetches server data while background work (image generation, publishing) is in progress. */
export function AutoRefresh({ active, intervalMs = 4000 }: { active: boolean; intervalMs?: number }) {
  const router = useRouter()
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => router.refresh(), intervalMs)
    return () => clearInterval(id)
  }, [active, intervalMs, router])
  return null
}
