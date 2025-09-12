import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthUser, createAuthResponse } from '@/lib/auth'
import { CanvaService } from '@/lib/canva-service'
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit'

const createDesignSchema = z.object({
    postId: z.string().cuid('Invalid post ID'),
    templateId: z.string().optional(),
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
        const validatedData = createDesignSchema.parse(body)

        // Get post and verify ownership
        const post = await prisma.post.findFirst({
            where: {
                id: validatedData.postId,
                company: {
                    userId: user.id
                }
            },
            include: {
                company: true,
            }
        })

        if (!post) {
            return Response.json(
                { error: 'Post not found or access denied' },
                { status: 404 }
            )
        }

        // Get Canva API key for the company
        const canvaApiKey = await prisma.apiKey.findFirst({
            where: {
                companyId: post.company.id,
                provider: 'canva',
                isActive: true,
            }
        })

        if (!canvaApiKey) {
            return Response.json(
                { error: 'Canva integration not found. Please connect your Canva account first.' },
                { status: 400 }
            )
        }

        // Initialize Canva service
        const canvaService = new CanvaService(canvaApiKey.keyValue)

        // Get available templates if none specified
        let templateId = validatedData.templateId
        if (!templateId) {
            const templates = await canvaService.getBrandTemplates()
            const appropriateTemplate = templates.find(t =>
                t.format?.toLowerCase().includes(post.format.toLowerCase()) ||
                t.name?.toLowerCase().includes(post.platform.toLowerCase())
            )

            if (!appropriateTemplate) {
                return Response.json(
                    { error: 'No suitable template found. Please specify a template ID or create templates in Canva first.' },
                    { status: 400 }
                )
            }

            templateId = appropriateTemplate.id
        }

        // Prepare brand kit
        const brandKit = post.company.brandKit as any
        const visualBrief = post.visualBrief as any

        // Get format dimensions
        const dimensions = CanvaService.getFormatDimensions(post.format, post.platform)

        // Create design request
        const designRequest = {
            templateId: templateId!,
            brandKit: {
                colors: [
                    brandKit.primaryColor,
                    brandKit.secondaryColor,
                    brandKit.accentColor || brandKit.primaryColor,
                ].filter(Boolean),
                logoUrl: brandKit.logoUrl,
            },
            content: {
                headline: post.headline,
                subhead: post.subhead || undefined,
                bodyText: post.caption.length > 200 ? post.headline : post.caption,
                logoPlacement: !!brandKit.logoUrl,
            },
            format: {
                width: dimensions.width,
                height: dimensions.height,
                format: post.format,
            }
        }

        // Create design in Canva
        const designResult = await canvaService.createDesignFromTemplate(designRequest)

        // Update post with design information
        const updatedPost = await prisma.post.update({
            where: { id: post.id },
            data: {
                designId: designResult.designId,
                status: 'GENERATED',
            }
        })

        return Response.json({
            message: 'Design created successfully',
            design: {
                id: designResult.designId,
                editUrl: designResult.editUrl,
            },
            post: updatedPost,
        }, { status: 201 })

    } catch (error: any) {
        console.error('Create design error:', error)

        if (error.name === 'ZodError') {
            return Response.json(
                { error: 'Validation error', details: error.errors },
                { status: 400 }
            )
        }

        return Response.json(
            { error: 'Failed to create design', details: error.message },
            { status: 500 }
        )
    }
}