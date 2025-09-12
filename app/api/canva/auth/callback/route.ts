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
        const state = url.searchParams.get('state') // Can contain companyId
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

        // Extract companyId from state if provided
        const companyId = state || url.searchParams.get('companyId')

        if (!companyId) {
            return Response.json(
                { error: 'Company ID required' },
                { status: 400 }
            )
        }

        // Verify company ownership
        const company = await prisma.company.findFirst({
            where: {
                id: companyId,
                userId: user.id
            }
        })

        if (!company) {
            return Response.json(
                { error: 'Company not found or access denied' },
                { status: 404 }
            )
        }

        // Exchange code for access token
        const canvaConfig = {
            clientId: process.env.CANVA_CLIENT_ID!,
            clientSecret: process.env.CANVA_CLIENT_SECRET!,
            redirectUri: process.env.CANVA_REDIRECT_URI!,
        }

        const tokenData = await CanvaService.getAccessToken(canvaConfig, code)

        // Store API key securely (you should encrypt this in production)
        await prisma.apiKey.upsert({
            where: {
                companyId_provider: {
                    companyId: company.id,
                    provider: 'canva'
                }
            },
            update: {
                keyValue: tokenData.access_token, // In production, encrypt this
                isActive: true,
            },
            create: {
                companyId: company.id,
                provider: 'canva',
                keyName: 'Canva Access Token',
                keyValue: tokenData.access_token, // In production, encrypt this
                isActive: true,
            }
        })

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
        })

    } catch (error: any) {
        console.error('Canva auth callback error:', error)
        return Response.json(
            { error: 'Failed to complete Canva integration', details: error.message },
            { status: 500 }
        )
    }
}