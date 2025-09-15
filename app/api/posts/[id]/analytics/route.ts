import { NextRequest } from 'next/server'
import { getAuthUser, createAuthResponse } from '@/lib/auth'
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit'
import { SocialMediaPublisher } from '@/lib/social-publisher'

interface RouteContext {
    params: {
        id: string
    }
}

export async function GET(request: NextRequest, { params }: RouteContext) {
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

        const postId = params.id

        if (!postId) {
            return Response.json(
                { error: 'Post ID is required' },
                { status: 400 }
            )
        }

        const analytics = await SocialMediaPublisher.getPostAnalytics(postId, user.id)

        return Response.json({
            postId,
            analytics
        })

    } catch (error: any) {
        console.error('Get post analytics error:', error)
        return Response.json(
            { error: 'Failed to get analytics', details: error.message },
            { status: 500 }
        )
    }
}