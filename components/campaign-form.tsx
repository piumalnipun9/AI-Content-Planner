"use client"

import { useActionState, useState } from "react"
import { Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SubmitButton } from "@/components/submit-button"
import { FormMessage } from "@/components/form-message"
import { PlatformIcon } from "@/components/platform-icon"
import { generateCampaign } from "@/app/actions/campaigns"

const IDEAS = [
  { name: "This week's content", brief: "A balanced week of always-on content that grows awareness and engagement." },
  { name: "Product launch", brief: "Build anticipation for and launch our newest product: teaser, reveal, benefits, social proof, last call." },
  { name: "Weekend promotion", brief: "Drive visits and sales this weekend with a time-limited offer. Urgency without being pushy." },
  { name: "Educational series", brief: "Teach our audience useful tips related to our products so they see us as the experts." },
  { name: "Meet the team", brief: "Behind-the-scenes posts introducing the people and process behind the brand." },
]

export function CampaignForm({ defaultStart, defaultCount, instagramReady }: { defaultStart: string; defaultCount: number; instagramReady: boolean }) {
  const [state, action] = useActionState(generateCampaign, undefined)
  const [name, setName] = useState(IDEAS[0].name)
  const [brief, setBrief] = useState(IDEAS[0].brief)

  return (
    <form action={action} className="space-y-6">
      <div className="space-y-2">
        <Label>Start from an idea</Label>
        <div className="flex flex-wrap gap-2">
          {IDEAS.map((i) => (
            <button
              key={i.name}
              type="button"
              onClick={() => { setName(i.name); setBrief(i.brief) }}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${name === i.name ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"}`}
            >
              {i.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5 sm:col-span-1">
          <Label htmlFor="name">Campaign name</Label>
          <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="brief">Brief</Label>
          <Textarea id="brief" name="brief" rows={3} value={brief} onChange={(e) => setBrief(e.target.value)} required
            placeholder="What's the goal? Any product, offer, event or message to focus on?" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <fieldset className="space-y-1.5 sm:col-span-2">
          <legend className="text-sm font-medium">Platforms</legend>
          <div className="flex gap-2">
            {(["INSTAGRAM", "FACEBOOK"] as const).map((p) => (
              <label key={p} className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm has-checked:border-primary has-checked:bg-primary/5">
                <input type="checkbox" name="platforms" value={p} defaultChecked className="accent-primary" />
                <PlatformIcon platform={p} />
                {p === "INSTAGRAM" ? "Instagram" : "Facebook"}
              </label>
            ))}
          </div>
          {!instagramReady && <p className="text-xs text-muted-foreground">Connect Facebook/Instagram in Settings to publish. You can still create posts now.</p>}
        </fieldset>
        <div className="space-y-1.5">
          <Label htmlFor="count">Number of posts</Label>
          <Input id="count" name="count" type="number" min={1} max={30} defaultValue={defaultCount} required />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="startDate">Start</Label>
            <Input id="startDate" name="startDate" type="date" defaultValue={defaultStart} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="days">Days</Label>
            <Input id="days" name="days" type="number" min={1} max={60} defaultValue={7} required />
          </div>
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm">
        <input type="checkbox" name="schedule" className="mt-0.5 accent-primary" />
        <span>
          <span className="font-medium">Schedule automatically</span>
          <span className="block text-muted-foreground">Posts go out at the AI-suggested times without review. Leave off to review drafts first.</span>
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton size="lg" pendingText="Writing your posts… (about 30s)">
          <Sparkles /> Generate plan
        </SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  )
}
