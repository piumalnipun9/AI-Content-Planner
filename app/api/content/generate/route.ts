import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generatePostsSchema } from '@/lib/validations'
import { getAuthUser, createAuthResponse } from '@/lib/auth'
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit'
import { AIService, PostGenerationRequest, AIProvider } from '@/lib/ai-service'

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
        const validatedData = generatePostsSchema.parse(body)

        const generatedPosts = []
        const aiProvider = 'GEMINI' // Only use Gemini

        // Generate posts for each platform and content type combination
        for (const platform of validatedData.platforms) {
            for (const contentType of validatedData.contentTypes) {
                const postsToGenerate = Math.ceil(validatedData.postCount / (validatedData.platforms.length * validatedData.contentTypes.length))

                for (let i = 0; i < postsToGenerate && generatedPosts.length < validatedData.postCount; i++) {
                    const format = getOptimalFormat(platform)

                    const generationRequest: PostGenerationRequest = {
                        userId: user.id,
                        prompt: validatedData.prompt,
                        brandTone: validatedData.brandTone,
                        contentType,
                        platform,
                        format,
                        additionalContext: `Generate content variation ${i + 1} for ${platform} ${contentType}`
                    }

                    try {
                        const generatedContent = await AIService.generatePostContent(generationRequest, aiProvider)

                        // Save to database
                        const post = await prisma.post.create({
                            data: {
                                userId: user.id,
                                title: generatedContent.title,
                                platform: generatedContent.platform as any,
                                format: generatedContent.format as any,
                                headline: generatedContent.headline,
                                subhead: generatedContent.subhead,
                                caption: generatedContent.caption,
                                hashtags: generatedContent.hashtags,
                                cta: generatedContent.cta,
                                visualBrief: generatedContent.visualBrief,
                                altText: generatedContent.altText,
                                status: 'GENERATED',
                            }
                        })

                        generatedPosts.push(post)

                    } catch (error) {
                        console.error(`Failed to generate post for ${platform} ${contentType}:`, error)
                        // Continue with other posts even if one fails
                    }

                    // Small delay to avoid overwhelming the API
                    await new Promise(resolve => setTimeout(resolve, 1000))
                }
            }
        }

        if (generatedPosts.length === 0) {
            return Response.json(
                { error: 'Failed to generate any posts. Please check your API keys and try again.' },
                { status: 500 }
            )
        }

        return Response.json({
            message: `Successfully generated ${generatedPosts.length} posts using Gemini`,
            posts: generatedPosts,
            provider: 'GEMINI'
        }, { status: 201 })

    } catch (error: any) {
        console.error('Content generation error:', error)

        if (error.name === 'ZodError') {
            return Response.json(
                { error: 'Validation error', details: error.errors },
                { status: 400 }
            )
        }

        return Response.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        )
    }
}

function getOptimalFormat(platform: string): 'SQUARE' | 'VERTICAL' | 'HORIZONTAL' | 'CAROUSEL' | 'REEL' | 'STORY' {
    const formatMap: Record<string, 'SQUARE' | 'VERTICAL' | 'HORIZONTAL' | 'CAROUSEL' | 'REEL' | 'STORY'> = {
        'INSTAGRAM': 'SQUARE',
        'FACEBOOK': 'HORIZONTAL',
        'TWITTER': 'HORIZONTAL',
        'TIKTOK': 'VERTICAL',
        'YOUTUBE_SHORTS': 'VERTICAL',
        'LINKEDIN': 'HORIZONTAL',
    }

    return formatMap[platform] || 'SQUARE'
}