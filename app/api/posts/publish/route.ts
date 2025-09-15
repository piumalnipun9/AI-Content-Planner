import { NextRequest } from 'next/server'
import { getAuthUser, createAuthResponse } from '@/lib/auth'
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit'
import { SocialMediaPublisher } from '@/lib/social-publisher'
import { z } from 'zod'

const publishSchema = z.object({
    postId: z.string().cuid('Invalid post ID'),
    action: z.enum(['publish', 'schedule']),
    scheduleTime: z.string().datetime().optional()
})

export async function POST(request: NextRequest) {
    try {
        // Check rate limit
        const rateLimitResult = await checkRateLimit(request, 'api')
        if (!rateLimitResult.success) {
            return createRateLimitResponse(rateLimitResult)
        }

        // Check authentication
        const user = getAuthUser(request)
        if (!user) {
            return createAuthResponse('Authentication required')
        }

        // Parse and validate request body
        const body = await request.json()
        const validatedData = publishSchema.parse(body)

        let result

        if (validatedData.action === 'publish') {
            // Publish immediately
            result = await SocialMediaPublisher.publishPost({
                postId: validatedData.postId,
                userId: user.id
            })
        } else {
            // Schedule for later
            if (!validatedData.scheduleTime) {
                return Response.json(
                    { error: 'Schedule time is required for scheduling posts' },
                    { status: 400 }
                )
            }

            result = await SocialMediaPublisher.schedulePost({
                postId: validatedData.postId,
                userId: user.id,
                scheduleTime: new Date(validatedData.scheduleTime)
            })
        }

        if (result.success) {
            return Response.json({
                message: `Post ${validatedData.action === 'publish' ? 'published' : 'scheduled'} successfully`,
                result
            })
        } else {
            return Response.json(
                { error: result.error },
                { status: 500 }
            )
        }

    } catch (error: any) {
        console.error('Publish/schedule post error:', error)

        if (error.name === 'ZodError') {
            return Response.json(
                { error: 'Validation error', details: error.errors },
                { status: 400 }
            )
        }

        return Response.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        )
    }
}