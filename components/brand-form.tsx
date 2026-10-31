"use client"

import { useActionState, useSyncExternalStore } from "react"
import type { Brand } from "@/lib/generated/prisma/client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SubmitButton } from "@/components/submit-button"
import { FormMessage } from "@/components/form-message"
import { saveBrand } from "@/app/actions/brand"

export const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

const noop = () => () => {}

/** A connected Facebook Page as offered in the picker; `usedBy` names another brand already linked to it. */
export interface PageChoice {
  id: string
  name: string
  igUsername?: string
  usedBy?: string
}

export function BrandForm({
  brand,
  zones,
  pages,
  defaultPageId,
  submitLabel = "Save",
}: {
  brand?: Brand | null
  zones: string[]
  /** Connected Pages; omit when Facebook isn't connected to hide the picker */
  pages?: PageChoice[]
  defaultPageId?: string
  submitLabel?: string
}) {
  const [state, action] = useActionState(saveBrand.bind(null, brand?.id ?? null), undefined)
  // New brands default to the browser's timezone; the server render falls back to UTC
  const browserZone = useSyncExternalStore(noop, () => Intl.DateTimeFormat().resolvedOptions().timeZone, () => "UTC")
  const timezone = brand?.timezone ?? browserZone

  return (
    <form action={action} className="space-y-5">
      {pages && pages.length > 0 && (
        <Field label="Facebook Page" hint="Posts for this brand publish to this Page and the Instagram account linked to it.">
          <select name="pageId" defaultValue={brand?.pageId ?? defaultPageId ?? ""} className={selectClass}>
            <option value="">Not linked yet</option>
            {pages.map((p) => (
              <option key={p.id} value={p.id} disabled={Boolean(p.usedBy)}>
                {p.name}
                {p.igUsername ? ` + Instagram @${p.igUsername}` : ""}
                {p.usedBy ? ` (used by ${p.usedBy})` : ""}
              </option>
            ))}
          </select>
        </Field>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Brand name">
          <Input name="name" defaultValue={brand?.name} placeholder="Bean & Bloom Café" required />
        </Field>
        <Field label="Industry">
          <Input name="industry" defaultValue={brand?.industry} placeholder="Specialty coffee shop" required />
        </Field>
      </div>
      <Field label="What does the business do?" hint="The more specific, the better the posts.">
        <Textarea name="description" defaultValue={brand?.description} rows={3} required
          placeholder="Neighbourhood café in Colombo roasting single-origin Sri Lankan coffee, with a small brunch menu and a plant-filled courtyard." />
      </Field>
      <Field label="Products & services" hint="Key offerings, signature items, current promotions.">
        <Textarea name="offerings" defaultValue={brand?.offerings} rows={3} required placeholder="Pour-overs, cold brew, avocado toast, coffee beans to take home, weekend latte-art workshops" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Target audience">
          <Textarea name="audience" defaultValue={brand?.audience} rows={2} required placeholder="Young professionals and students, 20-35, who work remotely" />
        </Field>
        <Field label="Goals">
          <Textarea name="goals" defaultValue={brand?.goals} rows={2} required placeholder="More weekday foot traffic, grow Instagram following, sell workshop seats" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tone of voice">
          <Input name="tone" defaultValue={brand?.tone} required placeholder="Warm, playful, a little witty" />
        </Field>
        <Field label="Visual style" hint="Used for every generated image.">
          <Input name="visualStyle" defaultValue={brand?.visualStyle ?? "Clean, modern, bright natural light"} required />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <Field label="Website">
          <Input name="website" defaultValue={brand?.website ?? ""} placeholder="https://…" />
        </Field>
        <Field label="Post language">
          <Input name="language" defaultValue={brand?.language ?? "English"} required />
        </Field>
        <Field label="Timezone">
          <select key={timezone} name="timezone" defaultValue={timezone} className={selectClass}>
            {(zones.includes(timezone) ? zones : [timezone, ...zones]).map((z) => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
        </Field>
        <Field label="Posts per week">
          <Input name="postsPerWeek" type="number" min={1} max={21} defaultValue={brand?.postsPerWeek ?? 4} required />
        </Field>
      </div>
      <div className="flex items-center gap-4">
        <SubmitButton size="lg" pendingText="Saving…">{submitLabel}</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  )
}
