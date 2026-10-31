/**
 * Single-series horizontal bar list. One hue (validated #2a78d6 on white), 12px bars with a 4px
 * rounded data-end, value at the tip in text ink, native tooltip with the full numbers on hover.
 */
export function BarList({
  rows,
  format,
  detail,
  empty = "No data yet",
}: {
  rows: { key: string; label: string; value: number }[]
  format: (v: number) => string
  detail?: (row: { key: string; label: string; value: number }) => string
  empty?: string
}) {
  if (!rows.length) return <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>
  const max = Math.max(...rows.map((r) => r.value), 0) || 1
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.key} className="group grid grid-cols-[7.5rem_1fr] items-center gap-3 text-sm" title={detail?.(r) ?? `${r.label}: ${format(r.value)}`}>
          <span className="truncate text-muted-foreground">{r.label}</span>
          <span className="flex items-center gap-2">
            <span
              className="h-3 rounded-r-[4px] bg-[var(--chart-bar)] transition-opacity group-hover:opacity-80"
              style={{ width: `${Math.max((r.value / max) * 85, r.value > 0 ? 1.5 : 0)}%` }}
            />
            <span className="tabular-nums text-foreground">{format(r.value)}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

export function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 })
export const fmtNumber = (n: number) => (n < 10_000 ? Math.round(n).toLocaleString("en") : compact.format(n))
export const fmtPercent = (n: number) => `${(n * 100).toFixed(n < 0.1 ? 2 : 1)}%`
