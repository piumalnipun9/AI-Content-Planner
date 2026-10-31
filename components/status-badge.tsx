import { CalendarClock, CheckCircle2, CircleDashed, Loader2, XCircle } from "lucide-react"
import type { PostStatus } from "@/lib/generated/prisma/enums"

const STYLES: Record<PostStatus, { label: string; className: string; Icon: typeof CheckCircle2 }> = {
  DRAFT: { label: "Draft", className: "bg-muted text-muted-foreground", Icon: CircleDashed },
  SCHEDULED: { label: "Scheduled", className: "bg-blue-50 text-blue-700", Icon: CalendarClock },
  PUBLISHING: { label: "Publishing", className: "bg-amber-50 text-amber-700", Icon: Loader2 },
  PUBLISHED: { label: "Published", className: "bg-emerald-50 text-emerald-700", Icon: CheckCircle2 },
  FAILED: { label: "Failed", className: "bg-red-50 text-red-700", Icon: XCircle },
}

export function StatusBadge({ status }: { status: PostStatus }) {
  const { label, className, Icon } = STYLES[status]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      <Icon className={`size-3 ${status === "PUBLISHING" ? "animate-spin" : ""}`} />
      {label}
    </span>
  )
}
