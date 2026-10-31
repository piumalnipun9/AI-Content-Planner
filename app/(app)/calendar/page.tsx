import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { requireBrand } from "@/lib/auth"
import { db } from "@/lib/db"
import { zonedTimeToUtc, formatInZone, localDate, WEEKDAYS } from "@/lib/time"
import { buttonVariants } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { PlatformIcon } from "@/components/platform-icon"

export const metadata = { title: "Calendar" }

const STATUS_DOT: Record<string, string> = {
  DRAFT: "bg-muted-foreground/40",
  SCHEDULED: "bg-blue-500",
  PUBLISHING: "bg-amber-500",
  PUBLISHED: "bg-emerald-500",
  FAILED: "bg-red-500",
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { brand } = await requireBrand()
  const tz = brand.timezone
  const { month } = await searchParams
  const today = localDate(tz)
  const [y, m] = (month && /^\d{4}-\d{2}$/.test(month) ? month : today.slice(0, 7)).split("-").map(Number)

  const start = zonedTimeToUtc(y, m, 1, 0, 0, tz)
  const end = zonedTimeToUtc(y, m + 1, 1, 0, 0, tz)
  const posts = await db.post.findMany({
    where: { brandId: brand.id, OR: [{ scheduledAt: { gte: start, lt: end } }, { publishedAt: { gte: start, lt: end } }] },
    orderBy: { scheduledAt: "asc" },
  })

  const byDay = new Map<string, typeof posts>()
  for (const p of posts) {
    const key = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(p.publishedAt ?? p.scheduledAt!)
    byDay.set(key, [...(byDay.get(key) ?? []), p])
  }

  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const firstWeekday = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7 // Monday first
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  const pad = (n: number) => String(n).padStart(2, "0")
  const shift = (delta: number) => {
    const d = new Date(Date.UTC(y, m - 1 + delta, 1))
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`
  }
  const title = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en", { month: "long", year: "numeric", timeZone: "UTC" })

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Calendar" description={`All times in ${tz}`}>
        <Link href={`/calendar?month=${shift(-1)}`} className={buttonVariants({ variant: "outline", size: "icon" })} aria-label="Previous month"><ChevronLeft /></Link>
        <span className="w-36 text-center font-medium">{title}</span>
        <Link href={`/calendar?month=${shift(1)}`} className={buttonVariants({ variant: "outline", size: "icon" })} aria-label="Next month"><ChevronRight /></Link>
      </PageHeader>

      <div className="mb-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
        {Object.entries({ Draft: "DRAFT", Scheduled: "SCHEDULED", Published: "PUBLISHED", Failed: "FAILED" }).map(([label, s]) => (
          <span key={s} className="flex items-center gap-1.5"><span className={`size-2 rounded-full ${STATUS_DOT[s]}`} />{label}</span>
        ))}
      </div>

      <div className="overflow-x-auto">
        <div className="grid min-w-[700px] grid-cols-7 overflow-hidden rounded-xl border bg-border gap-px">
          {[1, 2, 3, 4, 5, 6, 0].map((d) => (
            <div key={d} className="bg-muted/60 px-2 py-1.5 text-xs font-medium text-muted-foreground">{WEEKDAYS[d].slice(0, 3)}</div>
          ))}
          {cells.map((day, i) => {
            const key = day ? `${y}-${pad(m)}-${pad(day)}` : `empty-${i}`
            const items = day ? byDay.get(key) ?? [] : []
            return (
              <div key={key} className={`min-h-28 bg-card p-1.5 ${day ? "" : "bg-muted/30"}`}>
                {day && (
                  <>
                    <p className={`mb-1 text-xs ${key === today ? "inline-flex size-5 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground" : "text-muted-foreground"}`}>{day}</p>
                    <ul className="space-y-1">
                      {items.map((p) => (
                        <li key={p.id}>
                          <Link href={`/posts/${p.id}`} className="flex items-center gap-1 rounded-md border bg-background px-1.5 py-1 text-xs hover:bg-muted" title={p.hook}>
                            <span className={`size-1.5 shrink-0 rounded-full ${STATUS_DOT[p.status]}`} />
                            <PlatformIcon platform={p.platform} className="size-3 shrink-0" />
                            <span className="shrink-0 whitespace-nowrap tabular-nums text-muted-foreground">{formatInZone(p.publishedAt ?? p.scheduledAt!, tz, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" })}</span>
                            <span className="truncate">{p.hook}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
