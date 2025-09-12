import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generatePostsSchema } from '@/lib/validations'
import { getAuthUser, createAuthResponse } from '@/lib/auth'
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit'
import { OpenAIService, PostGenerationRequest } from '@/lib/openai-service'

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

        // Get company details and verify ownership
        const company = await prisma.company.findFirst({
            where: {
                id: validatedData.companyId,
                userId: user.id
            },
            include: {
                products: validatedData.productIds ? {
                    where: {
                        id: { in: validatedData.productIds }
                    }
                } : false
            }
        })

        if (!company) {
            return Response.json(
                { error: 'Company not found or access denied' },
                { status: 404 }
            )
        }

        const brandKit = company.brandKit as any
        if (!brandKit.primaryColor || !brandKit.secondaryColor) {
            return Response.json(
                { error: 'Company brand kit is incomplete. Please update brand colors.' },
                { status: 400 }
            )
        }

        const generatedPosts = []

        // Generate posts for each platform and content type combination
        for (const platform of validatedData.platforms) {
            for (const contentType of validatedData.contentTypes) {
                const postsToGenerate = Math.ceil(validatedData.postCount / (validatedData.platforms.length * validatedData.contentTypes.length))

                for (let i = 0; i < postsToGenerate && generatedPosts.length < validatedData.postCount; i++) {
                    // Select random product if productIds provided
                    const selectedProduct = company.products && company.products.length > 0
                        ? company.products[Math.floor(Math.random() * company.products.length)]
                        : undefined

                    const format = getOptimalFormat(platform)

                    const generationRequest: PostGenerationRequest = {
                        companyId: company.id,
                        companyName: company.name,
                        companyDescription: company.description,
                        brandTone: company.tone,
                        brandColors: {
                            primary: brandKit.primaryColor,
                            secondary: brandKit.secondaryColor,
                            accent: brandKit.accentColor || brandKit.primaryColor,
                        },
                        contentType,
                        platform,
                        format,
                        productContext: selectedProduct ? {
                            title: selectedProduct.title,
                            description: selectedProduct.description,
                            features: selectedProduct.features,
                            price: selectedProduct.price,
                            currency: selectedProduct.currency,
                        } : undefined,
                    }

                    try {
                        const generatedContent = await OpenAIService.generatePostContent(generationRequest)

                        // Save to database
                        const post = await prisma.post.create({
                            data: {
                                companyId: company.id,
                                title: generatedContent.title,
                                platform: generatedContent.platform as any,
                                format: generatedContent.format as any,
                                headline: generatedContent.headline,
                                subhead: generatedContent.subhead,
                                caption: generatedContent.caption,
                                hashtags: generatedContent.hashtags,
                                cta: generatedContent.cta,
                                visualBrief: generatedContent.visualBrief,
                                productRef: selectedProduct?.id,
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
                    await new Promise(resolve => setTimeout(resolve, 500))
                }
            }
        }

        if (generatedPosts.length === 0) {
            return Response.json(
                { error: 'Failed to generate any posts. Please try again.' },
                { status: 500 }
            )
        }

        return Response.json({
            message: `Successfully generated ${generatedPosts.length} posts`,
            posts: generatedPosts,
            company: {
                id: company.id,
                name: company.name,
            }
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
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

function getOptimalFormat(platform: string): string {
    const formatMap: Record<string, string> = {
        'INSTAGRAM': 'SQUARE',
        'FACEBOOK': 'HORIZONTAL',
        'TWITTER': 'HORIZONTAL',
        'TIKTOK': 'VERTICAL',
        'YOUTUBE_SHORTS': 'VERTICAL',
        'LINKEDIN': 'HORIZONTAL',
    }

    return formatMap[platform] || 'SQUARE'
}