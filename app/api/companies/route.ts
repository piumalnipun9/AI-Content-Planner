import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createCompanySchema } from '@/lib/validations'
import { getAuthUser, createAuthResponse } from '@/lib/auth'
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit'

// GET /api/companies - Get all companies for the authenticated user
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

        const companies = await prisma.company.findMany({
            where: { userId: user.id },
            include: {
                _count: {
                    select: {
                        products: true,
                        posts: true,
                        templates: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return Response.json({ companies })

    } catch (error) {
        console.error('Get companies error:', error)
        return Response.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// POST /api/companies - Create a new company
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
        const validatedData = createCompanySchema.parse(body)

        // Create company
        const company = await prisma.company.create({
            data: {
                userId: user.id,
                name: validatedData.name,
                description: validatedData.description,
                tone: validatedData.tone,
                brandKit: validatedData.brandKit,
            },
            include: {
                _count: {
                    select: {
                        products: true,
                        posts: true,
                        templates: true,
                    }
                }
            }
        })

        return Response.json({
            message: 'Company created successfully',
            company,
        }, { status: 201 })

    } catch (error: any) {
        console.error('Create company error:', error)

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