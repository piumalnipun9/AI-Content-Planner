import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { registerSchema } from '@/lib/validations'
import { hashPassword, generateToken } from '@/lib/auth'
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
    try {
        // Check rate limit
        const rateLimitResult = await checkRateLimit(request, 'auth')
        if (!rateLimitResult.success) {
            return createRateLimitResponse(rateLimitResult)
        }

        // Parse and validate request body
        const body = await request.json()
        const validatedData = registerSchema.parse(body)

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: validatedData.email }
        })

        if (existingUser) {
            return Response.json(
                { error: 'User with this email already exists' },
                { status: 400 }
            )
        }

        // Hash password and create user
        const hashedPassword = await hashPassword(validatedData.password)

        const user = await prisma.user.create({
            data: {
                email: validatedData.email,
                name: validatedData.name,
                password: hashedPassword,
            },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
            }
        })

        // Generate JWT token
        const token = generateToken({
            id: user.id,
            email: user.email,
            name: user.name || undefined,
        })

        return Response.json({
            message: 'User created successfully',
            user,
            token,
        }, { status: 201 })

    } catch (error: any) {
        console.error('Registration error:', error)

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