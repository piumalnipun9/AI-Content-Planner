import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthUser, createAuthResponse } from '@/lib/auth'
import { CanvaService } from '@/lib/canva-service'
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit'

const exportDesignSchema = z.object({
    postId: z.string().cuid('Invalid post ID'),
    format: z.enum(['PNG', 'JPG', 'PDF', 'MP4']).default('PNG'),
    quality: z.enum(['STANDARD', 'HIGH']).default('HIGH'),
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
        const validatedData = exportDesignSchema.parse(body)

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

        if (!post.designId) {
            return Response.json(
                { error: 'Design not found. Please create a design first.' },
                { status: 400 }
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

        // Export design
        const exportRequest = {
            designId: post.designId,
            format: validatedData.format,
            quality: validatedData.quality,
        }

        const exportResult = await canvaService.exportDesign(exportRequest)

        // Update post with export URLs
        const existingUrls = post.exportUrls || []
        const newUrls = [...existingUrls, exportResult.downloadUrl]

        const updatedPost = await prisma.post.update({
            where: { id: post.id },
            data: {
                exportUrls: newUrls,
            }
        })

        return Response.json({
            message: 'Design exported successfully',
            export: {
                format: validatedData.format,
                quality: validatedData.quality,
                url: exportResult.downloadUrl,
                exportUrl: exportResult.exportUrl,
            },
            post: {
                id: updatedPost.id,
                title: updatedPost.title,
                exportUrls: updatedPost.exportUrls,
            },
        })

    } catch (error: any) {
        console.error('Export design error:', error)

        if (error.name === 'ZodError') {
            return Response.json(
                { error: 'Validation error', details: error.errors },
                { status: 400 }
            )
        }

        return Response.json(
            { error: 'Failed to export design', details: error.message },
            { status: 500 }
        )
    }
}