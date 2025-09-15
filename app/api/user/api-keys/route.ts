import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createApiKeySchema } from '@/lib/validations'
import { getAuthUser, createAuthResponse } from '@/lib/auth'
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit'

// Get user's API keys
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

        const apiKeys = await prisma.apiKey.findMany({
            where: {
                userId: user.id,
                isActive: true
            },
            select: {
                id: true,
                provider: true,
                keyName: true,
                isActive: true,
                createdAt: true,
                updatedAt: true
                // Don't return keyValue for security
            }
        })

        return Response.json({ apiKeys })

    } catch (error: any) {
        console.error('Get API keys error:', error)
        return Response.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// Add/Update API key
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
        const validatedData = createApiKeySchema.parse(body)

        // Store API key (should encrypt in production)
        const apiKey = await prisma.apiKey.upsert({
            where: {
                userId_provider: {
                    userId: user.id,
                    provider: validatedData.provider
                }
            },
            update: {
                keyName: validatedData.keyName,
                keyValue: validatedData.keyValue, // TODO: Encrypt in production
                isActive: true,
                updatedAt: new Date()
            },
            create: {
                userId: user.id,
                provider: validatedData.provider,
                keyName: validatedData.keyName,
                keyValue: validatedData.keyValue, // TODO: Encrypt in production
                isActive: true
            },
            select: {
                id: true,
                provider: true,
                keyName: true,
                isActive: true,
                createdAt: true,
                updatedAt: true
            }
        })

        return Response.json({
            message: 'API key saved successfully',
            apiKey
        }, { status: 201 })

    } catch (error: any) {
        console.error('Save API key error:', error)

        if (error.name === 'ZodError') {
            return Response.json(
                { error: 'Validation error', details: error.errors },
                { status: 400 }
            )
        }

        return Response.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// Delete API key
export async function DELETE(request: NextRequest) {
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
        const keyId = url.searchParams.get('id')

        if (!keyId) {
            return Response.json(
                { error: 'API key ID is required' },
                { status: 400 }
            )
        }

        await prisma.apiKey.updateMany({
            where: {
                id: keyId,
                userId: user.id
            },
            data: {
                isActive: false
            }
        })

        return Response.json({ message: 'API key deleted successfully' })

    } catch (error: any) {
        console.error('Delete API key error:', error)
        return Response.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}