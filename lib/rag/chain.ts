import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { RunnableSequence } from '@langchain/core/runnables'
import { StringOutputParser } from '@langchain/core/output_parsers'
import type { Document } from '@langchain/core/documents'
import { retrieveContext } from './retrieve'
import type { PostGenerationRequest, GeneratedPostContent } from '@/lib/ai-service'

function buildPrompt(input: PostGenerationRequest, context: string) {
  return `You are an expert social media content strategist.
Use the retrieved brand context below to ensure on-brand, accurate content.

Brand Context (retrieved):\n${context}\n---\n
Task: Generate a JSON object with the following fields for a ${input.platform} post (${input.format}) focused on ${input.contentType}.
Reflect the brandTone values: ${input.brandTone.join(', ')}.

Required JSON shape:
{
  "title": string,
  "platform": one of [INSTAGRAM, FACEBOOK, TWITTER, TIKTOK, YOUTUBE_SHORTS, LINKEDIN],
  "format": one of [SQUARE, VERTICAL, HORIZONTAL, CAROUSEL, REEL, STORY],
  "headline": string,
  "subhead": string | null,
  "caption": string,
  "hashtags": string[],
  "cta": string,
  "visualBrief": { "style": "modern|minimal|bold|playful|elegant", "colors": string[], "imagery": "product|lifestyle|abstract|geometric|photography" },
  "altText": string
}

Rules:
- Return ONLY the JSON. No markdown.
- Base details on the retrieved context when relevant.
- Keep hashtags topical and brand-consistent.
- If additionalContext is present, incorporate it: ${input.additionalContext || 'n/a'}
`
}

export async function generateWithRag(input: PostGenerationRequest & { topK?: number }): Promise<GeneratedPostContent> {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('Missing GOOGLE_API_KEY/GEMINI_API_KEY')

  const k = input.topK ?? 4
  const docs = await retrieveContext(input.userId, input.prompt, k)
  const context = docs.map((d: { content: string }) => `- ${d.content}`).join('\n') || 'No context found.'

  const model = new ChatGoogleGenerativeAI({ apiKey, modelName: 'gemini-1.5-flash' })

  const chain = RunnableSequence.from([
    async () => buildPrompt(input, context),
    model,
    new StringOutputParser(),
  ])

  const raw = await chain.invoke({})

  try {
    const json = JSON.parse(raw)
    // Apply minimal defaults to satisfy GeneratedPostContent
    return {
      title: json.title || 'Untitled',
      platform: json.platform || input.platform,
      format: json.format || input.format,
      headline: json.headline || '',
      subhead: json.subhead || undefined,
      caption: json.caption || '',
      hashtags: Array.isArray(json.hashtags) ? json.hashtags : [],
      cta: json.cta || '',
      visualBrief: json.visualBrief || { style: 'modern', colors: ['#000000', '#FFFFFF'], imagery: 'product' },
      altText: json.altText || 'A promotional social media image.',
    }
  } catch (e) {
    // Best effort fallback: wrap as a caption-only post
    return {
      title: 'Generated Post',
      platform: input.platform,
      format: input.format,
      headline: 'Generated Headline',
      subhead: undefined,
      caption: typeof raw === 'string' ? raw.slice(0, 2000) : 'Generated content',
      hashtags: [],
      cta: 'Learn more',
      visualBrief: { style: 'modern', colors: ['#000000', '#FFFFFF'], imagery: 'product' },
      altText: 'A promotional social media image.',
    }
  }
}
