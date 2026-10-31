"use client"

import { useActionState, useState, useTransition } from "react"
import { CalendarClock, ImagePlus, Loader2, Send, Trash2, Wand2, Undo2 } from "lucide-react"
import { toast } from "sonner"
import type { Post } from "@/lib/generated/prisma/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FormMessage } from "@/components/form-message"
import { selectClass } from "@/components/brand-form"
import { aiRewrite, deletePost, publishNow, regenerateImage, savePost } from "@/app/actions/posts"

export function PostEditor({ post, localScheduled, canPublish }: { post: Post; localScheduled: string; canPublish: boolean }) {
  const [state, action, saving] = useActionState(savePost.bind(null, post.id), undefined)
  const [caption, setCaption] = useState(post.caption)
  const [hashtags, setHashtags] = useState(post.hashtags.map((h) => `#${h}`).join(" "))
  const [instruction, setInstruction] = useState("")
  const [pending, startTransition] = useTransition()
  const [busy, setBusy] = useState<string | null>(null)

  const run = (key: string, fn: () => Promise<void>) => {
    setBusy(key)
    startTransition(async () => {
      try {
        await fn()
      } finally {
        setBusy(null)
      }
    })
  }

  const rewrite = () =>
    run("rewrite", async () => {
      const r = await aiRewrite(post.id, instruction)
      if (r.error) return void toast.error(r.error)
      setCaption(r.caption!)
      setHashtags(r.hashtags!.map((h) => `#${h}`).join(" "))
      toast.success("Rewritten. Review it and save.")
    })

  const publish = () =>
    run("publish", async () => {
      const r = await publishNow(post.id)
      if (r?.error) toast.error(r.error)
      else toast.success("Published!")
    })

  const locked = post.status === "PUBLISHED" || post.status === "PUBLISHING"
  const imageBusy = post.imageState === "PENDING" || post.imageState === "GENERATING"

  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="platform">Platform</Label>
          <select id="platform" name="platform" defaultValue={post.platform} disabled={locked} className={selectClass}>
            <option value="INSTAGRAM">Instagram</option>
            <option value="FACEBOOK">Facebook</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="scheduledAt">Publish time</Label>
          <Input id="scheduledAt" name="scheduledAt" type="datetime-local" defaultValue={localScheduled} disabled={locked} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="caption">Caption</Label>
        <Textarea id="caption" name="caption" rows={10} value={caption} onChange={(e) => setCaption(e.target.value)} disabled={locked} />
        <p className="text-right text-xs text-muted-foreground">{caption.length} characters</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="hashtags">Hashtags</Label>
        <Textarea id="hashtags" name="hashtags" rows={2} value={hashtags} onChange={(e) => setHashtags(e.target.value)} disabled={locked} />
      </div>

      {!locked && (
        <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
          <Label htmlFor="instruction" className="flex items-center gap-1.5"><Wand2 className="size-3.5" /> Rewrite with AI</Label>
          <div className="flex gap-2">
            <Input id="instruction" value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder="e.g. shorter, more playful, add a question at the end" />
            <Button type="button" variant="outline" onClick={rewrite} disabled={pending}>
              {busy === "rewrite" ? <Loader2 className="animate-spin" /> : <Wand2 />} Rewrite
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="imagePrompt">Image prompt</Label>
        <Textarea id="imagePrompt" name="imagePrompt" rows={3} defaultValue={post.imagePrompt} disabled={locked} />
        {!locked && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending || imageBusy}
            onClick={(e) => {
              const prompt = (e.currentTarget.form?.elements.namedItem("imagePrompt") as HTMLTextAreaElement | null)?.value
              run("image", () => regenerateImage(post.id, prompt))
            }}
          >
            {imageBusy || busy === "image" ? <Loader2 className="animate-spin" /> : <ImagePlus />}
            {post.imageFile ? "Regenerate image" : "Generate image"}
          </Button>
        )}
      </div>

      <FormMessage state={state} />

      {!locked && (
        <div className="flex flex-wrap items-center gap-2 border-t pt-4">
          <Button type="submit" name="intent" value="save" variant="outline" disabled={saving}>Save</Button>
          {post.status === "SCHEDULED" ? (
            <Button type="submit" name="intent" value="unschedule" variant="outline" disabled={saving}><Undo2 /> Unschedule</Button>
          ) : (
            <Button type="submit" name="intent" value="schedule" disabled={saving}><CalendarClock /> Schedule</Button>
          )}
          <Button type="button" variant="secondary" onClick={publish} disabled={pending || !canPublish || imageBusy} title={canPublish ? "" : post.platform === "INSTAGRAM" ? "Needs a connected Instagram account and an image" : "Connect Facebook in Settings"}>
            {busy === "publish" ? <Loader2 className="animate-spin" /> : <Send />} Publish now
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="ml-auto"
            disabled={pending}
            onClick={() => confirm("Delete this post?") && run("delete", () => deletePost(post.id))}
          >
            <Trash2 /> Delete
          </Button>
        </div>
      )}
    </form>
  )
}
