/** Convert a wall-clock time in `timeZone` to a UTC Date. */
export function zonedTimeToUtc(year: number, month: number, day: number, hour: number, minute: number, timeZone: string) {
  const asUtc = Date.UTC(year, month - 1, day, hour, minute)
  const offset = tzOffsetMs(new Date(asUtc), timeZone)
  // Second pass corrects for DST transitions between the guess and the real instant
  const firstGuess = asUtc - offset
  return new Date(asUtc - tzOffsetMs(new Date(firstGuess), timeZone))
}

function tzOffsetMs(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  const wall = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"))
  return wall - Math.floor(date.getTime() / 1000) * 1000
}

/** Weekday (0 = Sunday) and hour of `date` as seen in `timeZone`. */
export function localParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", hour: "numeric", hourCycle: "h23" }).formatToParts(date)
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.find((p) => p.type === "weekday")!.value)
  const hour = Number(parts.find((p) => p.type === "hour")!.value)
  return { weekday, hour }
}

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export function formatInZone(date: Date, timeZone: string, opts: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" }) {
  return new Intl.DateTimeFormat("en-US", { timeZone, ...opts }).format(date)
}

/** "YYYY-MM-DDTHH:mm" in `timeZone`, for <input type="datetime-local"> */
export function toLocalInput(date: Date, timeZone: string) {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).formatToParts(date)
  const g = (t: string) => p.find((x) => x.type === t)!.value
  return `${g("year")}-${g("month")}-${g("day")}T${g("hour")}:${g("minute")}`
}

export function fromLocalInput(value: string, timeZone: string) {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!m) throw new Error("Invalid date/time")
  return zonedTimeToUtc(+m[1], +m[2], +m[3], +m[4], +m[5], timeZone)
}

/** Local calendar date (YYYY-MM-DD) in `timeZone`, `offsetDays` from now. */
export function localDate(timeZone: string, offsetDays = 0) {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date(Date.now() + offsetDays * 86_400_000))
}

export function isDueWithinMinutes(date: Date | null | undefined, minutes: number) {
  return Boolean(date && date.getTime() - Date.now() < minutes * 60_000)
}

export function isWithinDays(date: Date | null | undefined, days: number) {
  return Boolean(date && date.getTime() - Date.now() < days * 86_400_000)
}
