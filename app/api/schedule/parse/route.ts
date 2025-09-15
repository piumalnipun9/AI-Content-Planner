import { NextRequest } from 'next/server'
import { getAuthUser, createAuthResponse } from '@/lib/auth'
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit'
import { NaturalLanguageScheduler } from '@/lib/natural-scheduler'
import { z } from 'zod'

const parseScheduleSchema = z.object({
    input: z.string().min(1, 'Schedule input is required')
})

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
        const validatedData = parseScheduleSchema.parse(body)

        // Parse the natural language input
        const parseResult = NaturalLanguageScheduler.parseSchedule(validatedData.input)

        if (parseResult.success && parseResult.datetime) {
            // Validate the parsed datetime
            const validation = NaturalLanguageScheduler.validateScheduleTime(parseResult.datetime)

            if (!validation.valid) {
                return Response.json({
                    success: false,
                    error: validation.reason,
                    suggestions: NaturalLanguageScheduler.getSchedulingSuggestions()
                })
            }
        }

        return Response.json({
            success: parseResult.success,
            datetime: parseResult.datetime?.toISOString(),
            interpretation: parseResult.interpretation,
            confidence: parseResult.confidence,
            error: parseResult.error,
            suggestions: parseResult.success ? undefined : NaturalLanguageScheduler.getSchedulingSuggestions()
        })

    } catch (error: any) {
        console.error('Parse schedule error:', error)

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

// Get scheduling suggestions
export async function GET() {
    return Response.json({
        suggestions: NaturalLanguageScheduler.getSchedulingSuggestions(),
        examples: [
            {
                input: 'tomorrow at 3pm',
                description: 'Schedule for tomorrow at 3 PM'
            },
            {
                input: 'in 2 hours',
                description: 'Schedule for 2 hours from now'
            },
            {
                input: 'monday at 9:30am',
                description: 'Schedule for next Monday at 9:30 AM'
            },
            {
                input: 'this evening',
                description: 'Schedule for this evening (7 PM)'
            },
            {
                input: 'next week',
                description: 'Schedule for next week (Monday 9 AM)'
            }
        ]
    })
}