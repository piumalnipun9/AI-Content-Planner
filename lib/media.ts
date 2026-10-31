import { mkdir, writeFile, readFile, unlink } from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"
import { env } from "@/lib/env"

const MEDIA_DIR = path.join(process.cwd(), "storage", "media")

/**
 * Normalise to a 1080x1350 JPEG: Instagram only accepts JPEG and 4:5 is the largest feed format.
 * "cover" crops to fill the frame; "contain" fits the whole image on white (better for product shots).
 * Transparent areas become white rather than black.
 */
export async function saveImage(postId: string, bytes: Buffer, fit: "cover" | "contain" = "cover") {
  await mkdir(MEDIA_DIR, { recursive: true })
  const file = `${postId}-${Date.now()}.jpg`
  const jpeg = await sharp(bytes)
    .resize(1080, 1350, { fit, background: "#ffffff" })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 88, mozjpeg: true }).toBuffer()
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
  await unlink(path.join(MEDIA_DIR, file)).catch(() => {})
}

export const mediaPath = (file: string) => `/media/${file}`
/** Absolute URL that Meta's servers download the image from. */
export const publicMediaUrl = (file: string) => `${env.appUrl()}/media/${file}`
