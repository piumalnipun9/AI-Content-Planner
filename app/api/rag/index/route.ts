import { NextRequest } from 'next/server'
import { getAuthUser, createAuthResponse } from '@/lib/auth'
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit'
import { ragIngestSchema } from '@/lib/validations'
import { ingestBrandText } from '@/lib/rag/ingest'

export async function POST(request: NextRequest) {
  // Rate limit
  const rate = await checkRateLimit(request, 'api')
  if (!rate.success) return createRateLimitResponse(rate)

  // Auth
  const user = getAuthUser(request)
  if (!user) return createAuthResponse('Authentication required')

  try {
    const body = await request.json()
    const { text, metadata } = ragIngestSchema.parse(body)

    const result = await ingestBrandText({ userId: user.id, text, metadata })
    return Response.json({ message: 'Indexed brand knowledge', ...result }, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return Response.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return Response.json({ error: 'Failed to index brand documents', details: error.message }, { status: 500 })
  }
}
