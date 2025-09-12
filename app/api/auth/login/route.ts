import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { loginSchema } from '@/lib/validations'
import { verifyPassword, generateToken } from '@/lib/auth'
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
        const validatedData = loginSchema.parse(body)

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: validatedData.email },
            select: {
                id: true,
                email: true,
                name: true,
                password: true,
            }
        })

        if (!user) {
            return Response.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            )
        }

        // Verify password
        const isValidPassword = await verifyPassword(validatedData.password, user.password)

        if (!isValidPassword) {
            return Response.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            )
        }

        // Generate JWT token
        const token = generateToken({
            id: user.id,
            email: user.email,
            name: user.name || undefined,
        })

        const { password: _, ...userWithoutPassword } = user

        return Response.json({
            message: 'Login successful',
            user: userWithoutPassword,
            token,
        })

    } catch (error: any) {
        console.error('Login error:', error)

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