import { ImageOff, Loader2 } from "lucide-react"
import type { Post } from "@/lib/generated/prisma/client"
import { mediaPath } from "@/lib/media"

export function PostImage({ post, className = "" }: { post: Pick<Post, "imageFile" | "imageState" | "hook">; className?: string }) {
  const busy = post.imageState === "PENDING" || post.imageState === "GENERATING"
  if (post.imageFile && !busy) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={mediaPath(post.imageFile)} alt={post.hook} className={`aspect-[4/5] w-full object-cover ${className}`} />
  }
  return (
    <div className={`flex aspect-[4/5] w-full flex-col items-center justify-center gap-2 bg-muted text-xs text-muted-foreground ${className}`}>
      {busy ? <Loader2 className="size-5 animate-spin" /> : <ImageOff className="size-5" />}
      {busy ? "Generating image…" : post.imageState === "FAILED" ? "Image failed" : "No image"}
    </div>
  )
}
