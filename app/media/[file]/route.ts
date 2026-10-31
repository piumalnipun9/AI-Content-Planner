import { readImage } from "@/lib/media"

// Public on purpose: Facebook and Instagram fetch post images from this URL when publishing.
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params
  const bytes = await readImage(file)
  if (!bytes) return new Response("Not found", { status: 404 })
  return new Response(new Uint8Array(bytes), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=31536000, immutable" },
  })
}
