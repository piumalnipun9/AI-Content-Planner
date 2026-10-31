import { mkdir, writeFile, readFile, unlink } from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"
import { del, put } from "@vercel/blob"
import { env } from "@/lib/env"

const MEDIA_DIR = path.join(process.cwd(), "storage", "media")

/**
 * Where images live: Vercel Blob when BLOB_READ_WRITE_TOKEN is set (serverless hosts have no persistent disk),
 * otherwise storage/media on local disk. A post's imageFile holds the full blob URL or the local file name.
 */
const blobEnabled = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN)
const isUrl = (file: string) => /^https?:\/\//.test(file)

/**
 * Normalise to a 1080x1350 JPEG: Instagram only accepts JPEG and 4:5 is the largest feed format.
 * "cover" crops to fill the frame; "contain" fits the whole image on white (better for product shots).
 * Transparent areas become white rather than black.
 */
export async function saveImage(postId: string, bytes: Buffer, fit: "cover" | "contain" = "cover") {
  const file = `${postId}-${Date.now()}.jpg`
  const jpeg = await sharp(bytes)
    .resize(1080, 1350, { fit, background: "#ffffff" })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer()
  if (blobEnabled()) {
    const blob = await put(`media/${file}`, jpeg, { access: "public", contentType: "image/jpeg", addRandomSuffix: false })
    return blob.url
  }
  await mkdir(MEDIA_DIR, { recursive: true })
  await writeFile(path.join(MEDIA_DIR, file), jpeg)
  return file
}

export async function readImage(file: string) {
  if (!/^[\w-]+\.jpg$/.test(file)) return null
  try {
    return await readFile(path.join(MEDIA_DIR, file))
  } catch {
    return null
  }
}

export async function deleteImage(file: string | null) {
  if (!file) return
  if (isUrl(file)) {
    if (blobEnabled()) await del(file).catch(() => {})
    return
  }
  await unlink(path.join(MEDIA_DIR, file)).catch(() => {})
}

export const mediaPath = (file: string) => (isUrl(file) ? file : `/media/${file}`)
/** Absolute URL that Meta's servers download the image from. */
export const publicMediaUrl = (file: string) => (isUrl(file) ? file : `${env.appUrl()}/media/${file}`)
