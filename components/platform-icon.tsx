import type { Platform } from "@/lib/generated/prisma/enums"

/** Simple brand glyphs (lucide no longer ships brand icons). */
export function PlatformIcon({ platform, className = "size-4" }: { platform: Platform; className?: string }) {
  if (platform === "FACEBOOK") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-label="Facebook" role="img">
        <circle cx="12" cy="12" r="12" fill="#1877F2" />
        <path fill="#fff" d="M13.3 19v-6.1h2.1l.3-2.4h-2.4V9c0-.7.2-1.2 1.2-1.2h1.3V5.6c-.2 0-1-.1-1.9-.1-1.9 0-3.2 1.2-3.2 3.3v1.8H8.6v2.4h2.1V19h2.6z" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" className={className} aria-label="Instagram" role="img">
      <defs>
        <linearGradient id="ig" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#FEDA75" />
          <stop offset=".35" stopColor="#FA7E1E" />
          <stop offset=".65" stopColor="#D62976" />
          <stop offset="1" stopColor="#4F5BD5" />
        </linearGradient>
      </defs>
      <rect width="24" height="24" rx="6" fill="url(#ig)" />
      <rect x="5.5" y="5.5" width="13" height="13" rx="4" fill="none" stroke="#fff" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3.1" fill="none" stroke="#fff" strokeWidth="1.8" />
      <circle cx="16.1" cy="7.9" r="1" fill="#fff" />
    </svg>
  )
}

export const platformName = (p: Platform) => (p === "FACEBOOK" ? "Facebook" : "Instagram")
