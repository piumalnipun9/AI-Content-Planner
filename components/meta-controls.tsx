"use client"

import { useTransition } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { selectClass, type PageChoice } from "@/components/brand-form"
import { disconnectMeta, linkPage } from "@/app/actions/meta"
import { deleteBrand, setAutopilot } from "@/app/actions/brand"

/** Choose which connected Facebook Page a brand publishes to. */
export function BrandPageSelect({ brandId, pages, current }: { brandId: string; pages: PageChoice[]; current: string | null }) {
  const [pending, start] = useTransition()
  return (
    <div className="flex items-center gap-2">
      <select
        className={selectClass}
        defaultValue={current ?? ""}
        disabled={pending}
        onChange={(e) =>
          start(async () => {
            const r = await linkPage(brandId, e.target.value || null)
            if (r.error) toast.error(r.error)
            else toast.success(e.target.value ? "Page linked" : "Page unlinked")
          })
        }
      >
        <option value="">Not linked</option>
        {pages.map((p) => (
          <option key={p.id} value={p.id} disabled={Boolean(p.usedBy)}>
            {p.name}
            {p.igUsername ? ` + Instagram @${p.igUsername}` : " (no Instagram)"}
            {p.usedBy ? ` (used by ${p.usedBy})` : ""}
          </option>
        ))}
      </select>
      {pending && <Loader2 className="size-4 animate-spin" />}
    </div>
  )
}

export function DisconnectButton() {
  const [pending, start] = useTransition()
  return (
    <Button variant="destructive" size="sm" disabled={pending} onClick={() => confirm("Disconnect Facebook? All brands stop publishing until you reconnect.") && start(() => disconnectMeta())}>
      Disconnect
    </Button>
  )
}

export function AutopilotSwitch({ brandId, enabled }: { brandId: string; enabled: boolean }) {
  const [pending, start] = useTransition()
  return (
    <Switch
      checked={enabled}
      disabled={pending}
      onCheckedChange={(v) =>
        start(async () => {
          await setAutopilot(brandId, v)
          toast.success(v ? "Autopilot on" : "Autopilot off")
        })
      }
    />
  )
}

export function DeleteBrandButton({ brandId, name }: { brandId: string; name: string }) {
  const [pending, start] = useTransition()
  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={pending}
      onClick={() => confirm(`Delete "${name}" and all of its posts, campaigns and analytics in Postpilot? Posts already on Facebook/Instagram stay there.`) && start(() => deleteBrand(brandId))}
    >
      Delete brand
    </Button>
  )
}
