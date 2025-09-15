import { prisma } from '@/lib/prisma'
import { MetaService } from '@/lib/meta-service'

interface PublishRequest {
    postId: string
    userId: string
    scheduleTime?: Date
}

interface PublishResult {
    success: boolean
    publishedId?: string
    error?: string
    platform: string
}

export class SocialMediaPublisher {

    // Publish a post immediately
    static async publishPost(request: PublishRequest): Promise<PublishResult> {
        try {
            // Get the post from database
            const post = await prisma.post.findFirst({
                where: {
                    id: request.postId,
                    userId: request.userId
                }
            })

            if (!post) {
                throw new Error('Post not found or access denied')
            }

            // Get user's social account for the platform
            const socialAccount = await prisma.socialAccount.findFirst({
                where: {
                    userId: request.userId,
                    platform: post.platform,
                    isActive: true
                }
            })

            if (!socialAccount) {
                throw new Error(`No active ${post.platform} account connected`)
            }

            let publishResult: any

            switch (post.platform) {
                case 'FACEBOOK':
                    publishResult = await this.publishToFacebook(post, socialAccount)
                    break
                case 'INSTAGRAM':
                    publishResult = await this.publishToInstagram(post, socialAccount)
                    break
                default:
                    throw new Error(`Publishing to ${post.platform} not yet supported`)
            }

            // Update post status in database
            await prisma.post.update({
                where: { id: post.id },
                data: {
                    status: 'PUBLISHED',
                    publishedAt: new Date(),
                    metrics: {
                        publishedId: publishResult.id,
                        platform: post.platform
                    }
                }
            })

            return {
                success: true,
                publishedId: publishResult.id,
                platform: post.platform
            }

        } catch (error: any) {
            console.error('Publish post error:', error)

            // Update post status to failed
            await prisma.post.update({
                where: { id: request.postId },
                data: {
                    status: 'FAILED',
                    metrics: {
                        error: error.message,
                        failedAt: new Date()
                    }
                }
            }).catch(console.error)

            return {
                success: false,
                error: error.message,
                platform: 'unknown'
            }
        }
    }

    // Schedule a post for later publishing
    static async schedulePost(request: PublishRequest): Promise<PublishResult> {
        try {
            if (!request.scheduleTime) {
                throw new Error('Schedule time is required')
            }

            // Get the post from database
            const post = await prisma.post.findFirst({
                where: {
                    id: request.postId,
                    userId: request.userId
                }
            })

            if (!post) {
                throw new Error('Post not found or access denied')
            }

            // Get user's social account for the platform
            const socialAccount = await prisma.socialAccount.findFirst({
                where: {
                    userId: request.userId,
                    platform: post.platform,
                    isActive: true
                }
            })

            if (!socialAccount) {
                throw new Error(`No active ${post.platform} account connected`)
            }

            let scheduleResult: any
            const metaService = new MetaService({
                appId: process.env.META_APP_ID!,
                appSecret: process.env.META_APP_SECRET!,
                accessToken: socialAccount.accessToken
            })

            switch (post.platform) {
                case 'FACEBOOK':
                    scheduleResult = await metaService.schedulePost(
                        socialAccount.accountId,
                        socialAccount.accessToken,
                        {
                            message: post.caption,
                            // Add other Facebook-specific fields
                        },
                        request.scheduleTime,
                        'FACEBOOK'
                    )
                    break
                case 'INSTAGRAM':
                    scheduleResult = await metaService.schedulePost(
                        socialAccount.accountId,
                        socialAccount.accessToken,
                        {
                            caption: post.caption,
                            // Add image/video URLs when available
                        },
                        request.scheduleTime,
                        'INSTAGRAM'
                    )
                    break
                default:
                    throw new Error(`Scheduling for ${post.platform} not yet supported`)
            }

            // Update post in database
            await prisma.post.update({
                where: { id: post.id },
                data: {
                    status: 'SCHEDULED',
                    scheduledAt: request.scheduleTime,
                    metrics: {
                        scheduledId: scheduleResult.id,
                        platform: post.platform
                    }
                }
            })

            return {
                success: true,
                publishedId: scheduleResult.id,
                platform: post.platform
            }

        } catch (error: any) {
            console.error('Schedule post error:', error)
            return {
                success: false,
                error: error.message,
                platform: 'unknown'
            }
        }
    }

    // Get analytics for published posts
    static async getPostAnalytics(postId: string, userId: string): Promise<any> {
        try {
            const post = await prisma.post.findFirst({
                where: {
                    id: postId,
                    userId,
                    status: 'PUBLISHED'
                }
            })

            if (!post || !post.metrics) {
                throw new Error('Post not found or not published')
            }

            const metrics = post.metrics as any
            if (!metrics.publishedId) {
                throw new Error('No published post ID found')
            }

            // Get social account for access token
            const socialAccount = await prisma.socialAccount.findFirst({
                where: {
                    userId,
                    platform: post.platform,
                    isActive: true
                }
            })

            if (!socialAccount) {
                throw new Error('Social account not found')
            }

            const metaService = new MetaService({
                appId: process.env.META_APP_ID!,
                appSecret: process.env.META_APP_SECRET!,
                accessToken: socialAccount.accessToken
            })

            const insights = await metaService.getPostInsights(
                metrics.publishedId,
                socialAccount.accessToken
            )

            // Update post metrics in database
            await prisma.post.update({
                where: { id: postId },
                data: {
                    metrics: {
                        ...metrics,
                        insights,
                        lastUpdated: new Date()
                    }
                }
            })

            return insights

        } catch (error: any) {
            console.error('Get post analytics error:', error)
            throw error
        }
    }

    // Check and publish scheduled posts (would be called by a cron job)
    static async processScheduledPosts(): Promise<void> {
        try {
            const now = new Date()

            // Find posts scheduled for publishing
            const scheduledPosts = await prisma.post.findMany({
                where: {
                    status: 'SCHEDULED',
                    scheduledAt: {
                        lte: now
                    }
                },
                include: {
                    user: true
                }
            })

            console.log(`Processing ${scheduledPosts.length} scheduled posts`)

            for (const post of scheduledPosts) {
                try {
                    await this.publishPost({
                        postId: post.id,
                        userId: post.userId
                    })
                    console.log(`Published post ${post.id} successfully`)
                } catch (error) {
                    console.error(`Failed to publish post ${post.id}:`, error)
                }

                // Small delay between posts
                await new Promise(resolve => setTimeout(resolve, 2000))
            }

        } catch (error) {
            console.error('Process scheduled posts error:', error)
        }
    }

    private static async publishToFacebook(post: any, socialAccount: any): Promise<any> {
        const metaService = new MetaService({
            appId: process.env.META_APP_ID!,
            appSecret: process.env.META_APP_SECRET!,
            accessToken: socialAccount.accessToken
        })

        return await metaService.postToFacebook(
            socialAccount.accountId,
            socialAccount.accessToken,
            {
                message: post.caption,
                // Add other fields as needed
            }
        )
    }

    private static async publishToInstagram(post: any, socialAccount: any): Promise<any> {
        const metaService = new MetaService({
            appId: process.env.META_APP_ID!,
            appSecret: process.env.META_APP_SECRET!,
            accessToken: socialAccount.accessToken
        })

        return await metaService.postToInstagram(
            socialAccount.accountId,
            socialAccount.accessToken,
            {
                caption: post.caption,
                // Add image_url when available
                // image_url: post.imageUrl
            }
        )
    }
}

export default SocialMediaPublisher