import { NextRequest } from 'next/server'
import { getAuthUser, createAuthResponse } from '@/lib/auth'
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit'
import { MetaService } from '@/lib/meta-service'

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
        const error = url.searchParams.get('error')
        const state = url.searchParams.get('state')

        if (error) {
            return Response.json(
                { error: 'Meta authorization failed', details: error },
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
        const metaConfig = {
            appId: process.env.META_APP_ID!,
            appSecret: process.env.META_APP_SECRET!,
            redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/meta/callback`
        }

        const tokenData = await MetaService.exchangeCodeForToken(
            metaConfig.appId,
            metaConfig.appSecret,
            code,
            metaConfig.redirectUri
        )

        // Initialize Meta service
        const metaService = new MetaService({
            appId: metaConfig.appId,
            appSecret: metaConfig.appSecret,
            accessToken: tokenData.access_token
        })

        // Get user's Facebook pages
        const facebookPages = await metaService.getFacebookPages(tokenData.access_token)

        // Get Instagram business account
        let instagramAccount = null
        try {
            instagramAccount = await metaService.getInstagramBusinessAccount(tokenData.access_token)
        } catch (error) {
            console.log('No Instagram business account found')
        }

        const connectedAccounts = []

        // Save Facebook pages
        for (const page of facebookPages) {
            await MetaService.saveSocialAccount(user.id, 'FACEBOOK', {
                accountId: page.id,
                username: page.name,
                accessToken: page.access_token,
                tokenExpiry: tokenData.expires_in
                    ? new Date(Date.now() + tokenData.expires_in * 1000)
                    : undefined
            })

            connectedAccounts.push({
                platform: 'FACEBOOK',
                id: page.id,
                name: page.name
            })
        }

        // Save Instagram account if available
        if (instagramAccount) {
            await MetaService.saveSocialAccount(user.id, 'INSTAGRAM', {
                accountId: instagramAccount.id,
                username: instagramAccount.username || instagramAccount.name,
                accessToken: tokenData.access_token,
                tokenExpiry: tokenData.expires_in
                    ? new Date(Date.now() + tokenData.expires_in * 1000)
                    : undefined
            })

            connectedAccounts.push({
                platform: 'INSTAGRAM',
                id: instagramAccount.id,
                name: instagramAccount.username || instagramAccount.name
            })
        }

        return Response.json({
            message: 'Meta accounts connected successfully',
            connectedAccounts,
            expiresIn: tokenData.expires_in
        })

    } catch (error: any) {
        console.error('Meta auth callback error:', error)
        return Response.json(
            { error: 'Failed to complete Meta integration', details: error.message },
            { status: 500 }
        )
    }
}