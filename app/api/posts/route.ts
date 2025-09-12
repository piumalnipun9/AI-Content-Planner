import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createPostSchema } from '@/lib/validations'
import { getAuthUser, createAuthResponse } from '@/lib/auth'
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit'

// GET /api/posts - Get posts for user's companies
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
        const companyId = url.searchParams.get('companyId')
        const platform = url.searchParams.get('platform')
        const status = url.searchParams.get('status')
        const page = parseInt(url.searchParams.get('page') || '1')
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50)

        const where: any = {
            company: {
                userId: user.id
            }
        }

        if (companyId) {
            where.companyId = companyId
        }
        if (platform) {
            where.platform = platform
        }
        if (status) {
            where.status = status
        }

        const posts = await prisma.post.findMany({
            where,
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        })

        const total = await prisma.post.count({ where })

        return Response.json({
            posts,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            }
        })

    } catch (error) {
        console.error('Get posts error:', error)
        return Response.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// POST /api/posts - Create a new post manually
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
        const validatedData = createPostSchema.parse(body)

        // Verify company ownership
        const company = await prisma.company.findFirst({
            where: {
                id: body.companyId,
                userId: user.id
            }
        })

        if (!company) {
            return Response.json(
                { error: 'Company not found or access denied' },
                { status: 404 }
            )
        }

        // Create post
        const post = await prisma.post.create({
            data: {
                companyId: body.companyId,
                title: validatedData.title,
                platform: validatedData.platform,
                format: validatedData.format,
                headline: validatedData.headline,
                subhead: validatedData.subhead,
                caption: validatedData.caption,
                hashtags: validatedData.hashtags,
                cta: validatedData.cta,
                visualBrief: validatedData.visualBrief,
                productRef: validatedData.productRef,
                altText: validatedData.altText,
                status: 'DRAFT',
            },
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            }
        })

        return Response.json({
            message: 'Post created successfully',
            post,
        }, { status: 201 })

    } catch (error: any) {
        console.error('Create post error:', error)

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