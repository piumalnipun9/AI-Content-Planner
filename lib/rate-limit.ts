import { RateLimiterMemory } from 'rate-limiter-flexible'
import { NextRequest } from 'next/server'

// Create different rate limiters for different endpoints
const authLimiter = new RateLimiterMemory({
    points: 5, // 5 attempts
    duration: 900, // per 15 minutes
})

const apiLimiter = new RateLimiterMemory({
    points: 100, // 100 requests
    duration: 900, // per 15 minutes
})

const uploadLimiter = new RateLimiterMemory({
    points: 10, // 10 uploads
    duration: 3600, // per hour
})

function getClientIp(req: NextRequest): string {
    return req.headers.get('x-forwarded-for') ||
        req.headers.get('x-real-ip') ||
        req.ip ||
        'unknown'
}

export async function checkRateLimit(req: NextRequest, type: 'auth' | 'api' | 'upload' = 'api') {
    const limiter = type === 'auth' ? authLimiter : type === 'upload' ? uploadLimiter : apiLimiter
    const clientIp = getClientIp(req)

    try {
        await limiter.consume(clientIp)
        return { success: true }
    } catch (rejRes: any) {
        const remainingPoints = rejRes?.remainingPoints || 0
        const msBeforeNext = rejRes?.msBeforeNext || 0

        return {
            success: false,
            remainingPoints,
            msBeforeNext,
            resetTime: new Date(Date.now() + msBeforeNext)
        }
    }
}

export function createRateLimitResponse(rateLimitResult: any) {
    const resetTime = Math.round(rateLimitResult.resetTime.getTime() / 1000)

    return Response.json(
        { error: 'Rate limit exceeded', resetTime },
        {
            status: 429,
            headers: {
                'X-RateLimit-Limit': '100',
                'X-RateLimit-Remaining': rateLimitResult.remainingPoints.toString(),
                'X-RateLimit-Reset': resetTime.toString(),
                'Retry-After': Math.round(rateLimitResult.msBeforeNext / 1000).toString()
            }
        }
    )
}