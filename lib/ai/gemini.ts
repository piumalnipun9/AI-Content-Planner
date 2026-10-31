import { ApiError, GoogleGenAI } from "@google/genai"
import { z } from "zod"
import { env } from "@/lib/env"

let client: GoogleGenAI | null = null
function ai() {
  const baseUrl = env.geminiBaseUrl()
  client ??= new GoogleGenAI({ apiKey: env.geminiKey(), ...(baseUrl ? { httpOptions: { baseUrl } } : {}) })
  return client
}

const RETRYABLE = new Set([429, 500, 502, 503, 504])

/** Both SDK surfaces (models.* and interactions.*) throw errors carrying an HTTP `status`. */
function statusOf(e: unknown) {
  if (e instanceof ApiError) return e.status
  const status = (e as { status?: unknown })?.status
  return typeof status === "number" ? status : undefined
}

/** A quota of zero (e.g. image models on the free tier) will never succeed, so don't retry it. */
const noQuota = (e: unknown) => statusOf(e) === 429 && /limit: 0\b/.test((e as Error).message)

/**
 * Retry rate limits and "model overloaded" errors with backoff (2s, 4s), then try the fallback model.
 */
async function withRetry<T>(models: string[], fn: (model: string) => Promise<T>): Promise<T> {
  let last: unknown
  for (const model of [...new Set(models)]) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await fn(model)
      } catch (e) {
        last = e
        const status = statusOf(e)
        if (noQuota(e)) break
        if (!status || !RETRYABLE.has(status)) throw friendly(e)
        if (attempt < 2) await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt))
      }
    }
    console.warn(`[gemini] ${model} unavailable (${(last as Error).message.slice(0, 120)}), trying fallback`)
  }
  throw friendly(last)
}

function friendly(e: unknown) {
  const status = statusOf(e)
  if (noQuota(e)) {
    return new Error("Your Gemini API plan has no quota for this model (the free tier allows 0 image generations). Enable billing for your API key at aistudio.google.com.")
  }
  if (status === 503) return new Error("Gemini is overloaded right now. Please try again in a few minutes.")
  if (status === 429) return new Error("Gemini rate limit reached. Wait a minute or check your plan at aistudio.google.com.")
  if (status === 400 || status === 403) return new Error(`Gemini rejected the request: ${(e as Error).message}`)
  return e
}

/** Ask the text model for JSON matching `schema`, validated with zod. */
export async function generateJson<T extends z.ZodType>(
  schema: T,
  prompt: string,
  system?: string,
): Promise<z.infer<T>> {
  const response = await withRetry([env.textModel(), env.fallbackTextModel()], (model) =>
    ai().models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: system,
        responseMimeType: "application/json",
        responseJsonSchema: z.toJSONSchema(schema),
        temperature: 0.9,
      },
    }),
  )
  const text = response.text
  if (!text) throw new Error("Gemini returned an empty response")
  return schema.parse(JSON.parse(text))
}

/** Generate one image and return its raw bytes. */
export async function generateImage(prompt: string): Promise<Buffer> {
  const interaction = await withRetry([env.imageModel(), env.fallbackImageModel()], (model) =>
    ai().interactions.create({ model, input: prompt }),
  )
  const image = interaction.output_image
  if (!image?.data) throw new Error("Gemini did not return an image")
  return Buffer.from(image.data, "base64")
}
