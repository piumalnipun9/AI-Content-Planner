import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateCompanySchema } from '@/lib/validations'
import { getAuthUser, createAuthResponse } from '@/lib/auth'
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit'

// GET /api/companies/[id] - Get a specific company
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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

        const company = await prisma.company.findFirst({
            where: {
                id: params.id,
                userId: user.id
            },
            include: {
                products: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
                posts: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
                templates: {
                    where: { isActive: true },
                    orderBy: { createdAt: 'desc' },
                },
                _count: {
                    select: {
                        products: true,
                        posts: true,
                        templates: true,
                    }
                }
            }
        })

        if (!company) {
            return Response.json(
                { error: 'Company not found' },
                { status: 404 }
            )
        }

        return Response.json({ company })

    } catch (error) {
        console.error('Get company error:', error)
        return Response.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// PUT /api/companies/[id] - Update a company
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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

        // Check if company exists and belongs to user
        const existingCompany = await prisma.company.findFirst({
            where: {
                id: params.id,
                userId: user.id
            }
        })

        if (!existingCompany) {
            return Response.json(
                { error: 'Company not found' },
                { status: 404 }
            )
        }

        // Parse and validate request body
        const body = await request.json()
        const validatedData = updateCompanySchema.parse(body)

        // Update company
        const company = await prisma.company.update({
            where: { id: params.id },
            data: validatedData,
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
            message: 'Company updated successfully',
            company,
        })

    } catch (error: any) {
        console.error('Update company error:', error)

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

// DELETE /api/companies/[id] - Delete a company
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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

        // Check if company exists and belongs to user
        const existingCompany = await prisma.company.findFirst({
            where: {
                id: params.id,
                userId: user.id
            }
        })

        if (!existingCompany) {
            return Response.json(
                { error: 'Company not found' },
                { status: 404 }
            )
        }

        // Delete company (cascade will handle related records)
        await prisma.company.delete({
            where: { id: params.id }
        })

        return Response.json({
            message: 'Company deleted successfully',
        })

    } catch (error) {
        console.error('Delete company error:', error)
        return Response.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}