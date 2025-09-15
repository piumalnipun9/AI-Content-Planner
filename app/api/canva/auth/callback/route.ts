import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, createAuthResponse } from '@/lib/auth'
import { CanvaService } from '@/lib/canva-service'
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
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

        const url = new URL(request.url)
        const code = url.searchParams.get('code')
        const state = url.searchParams.get('state')
        const error = url.searchParams.get('error')

        if (error) {
            return Response.json(
                { error: 'Canva authorization failed', details: error },
                { status: 400 }
            )
        }

        if (!code) {
            return Response.json(
                { error: 'Authorization code missing' },
                { status: 400 }
            )
        }

        // Exchange code for access token
        const canvaConfig = {
            clientId: process.env.CANVA_CLIENT_ID!,
            clientSecret: process.env.CANVA_CLIENT_SECRET!,
            redirectUri: process.env.CANVA_REDIRECT_URI!,
        }

        const tokenData = await CanvaService.getAccessToken(canvaConfig, code)

        // For now, we'll store the Canva credentials in a simple way
        // In a production app, you might want to add an ApiKey or Integration model
        // For this demo, we'll store it in localStorage on client side or use environment variables

        // Initialize Canva service to get user info
        const canvaService = new CanvaService(tokenData.access_token)
        const userProfile = await canvaService.getUserProfile()

        return Response.json({
            message: 'Canva integration successful',
            canvaUser: {
                id: userProfile.id,
                display_name: userProfile.display_name,
                team_id: userProfile.team_id,
            },
            expiresIn: tokenData.expires_in,
            // Note: In production, you should securely store the access token
            // For now, we return it to be stored client-side
            accessToken: tokenData.access_token,
        })

    } catch (error: any) {
        console.error('Canva auth callback error:', error)
        return Response.json(
            { error: 'Failed to complete Canva integration', details: error.message },
            { status: 500 }
        )
    }
}