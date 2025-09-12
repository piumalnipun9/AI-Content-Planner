import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createProductSchema, updateProductSchema } from '@/lib/validations'
import { getAuthUser, createAuthResponse } from '@/lib/auth'
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit'

// GET /api/products - Get products for user's companies
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
        const page = parseInt(url.searchParams.get('page') || '1')
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50)
        const search = url.searchParams.get('search')

        const where: any = {
            company: {
                userId: user.id
            },
            isActive: true,
        }

        if (companyId) {
            where.companyId = companyId
        }

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
            ]
        }

        const products = await prisma.product.findMany({
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

        const total = await prisma.product.count({ where })

        return Response.json({
            products,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            }
        })

    } catch (error) {
        console.error('Get products error:', error)
        return Response.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// POST /api/products - Create a new product
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
        const validatedData = createProductSchema.parse(body)

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

        // Check if SKU already exists for this company
        const existingProduct = await prisma.product.findFirst({
            where: {
                companyId: body.companyId,
                sku: validatedData.sku,
            }
        })

        if (existingProduct) {
            return Response.json(
                { error: 'Product with this SKU already exists' },
                { status: 400 }
            )
        }

        // Create product
        const product = await prisma.product.create({
            data: {
                companyId: body.companyId,
                sku: validatedData.sku,
                title: validatedData.title,
                description: validatedData.description,
                price: validatedData.price,
                currency: validatedData.currency,
                images: validatedData.images,
                features: validatedData.features,
                categories: validatedData.categories,
                tags: validatedData.tags,
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
            message: 'Product created successfully',
            product,
        }, { status: 201 })

    } catch (error: any) {
        console.error('Create product error:', error)

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