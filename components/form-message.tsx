import { AlertCircle, CheckCircle2 } from "lucide-react"
import type { FormState } from "@/app/actions/auth"

export function FormMessage({ state }: { state: FormState }) {
  if (!state?.error && !state?.ok) return null
  const error = Boolean(state.error)
  return (
    <p role={error ? "alert" : "status"} className={`flex items-center gap-2 text-sm ${error ? "text-destructive" : "text-emerald-700"}`}>
      {error ? <AlertCircle className="size-4 shrink-0" /> : <CheckCircle2 className="size-4 shrink-0" />}
      {state.error ?? state.ok}
    </p>
  )
}
