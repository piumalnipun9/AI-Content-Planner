import { NextRequest } from 'next/server'
import { getAuthUser, createAuthResponse } from '@/lib/auth'
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit'
import { ragGenerateSchema } from '@/lib/validations'
import { prisma } from '@/lib/prisma'
import { generateWithRag } from '@/lib/rag/chain'

export async function POST(request: NextRequest) {
  // Rate limit
  const rate = await checkRateLimit(request, 'api')
  if (!rate.success) return createRateLimitResponse(rate)

  // Auth
  const user = getAuthUser(request)
  if (!user) return createAuthResponse('Authentication required')

  try {
    const body = await request.json()
    const data = ragGenerateSchema.parse(body)

    const generated = await generateWithRag({
      userId: user.id,
      prompt: data.prompt,
      brandTone: data.brandTone,
      platform: data.platform,
      format: data.format,
      contentType: data.contentType,
      additionalContext: 'RAG: include relevant brand facts from retrieved context',
      topK: data.topK,
    })

    const post = await prisma.post.create({
      data: {
        userId: user.id,
        title: generated.title,
        platform: generated.platform as any,
        format: generated.format as any,
        headline: generated.headline,
        subhead: generated.subhead,
        caption: generated.caption,
        hashtags: generated.hashtags,
        cta: generated.cta,
        visualBrief: generated.visualBrief,
        altText: generated.altText,
        status: 'GENERATED',
      }
    })

    return Response.json({ message: 'Generated with RAG', post, provider: 'RAG' }, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return Response.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return Response.json({ error: 'Generation failed', details: error.message }, { status: 500 })
  }
}
