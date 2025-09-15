import { prisma } from '@/lib/prisma'

interface MetaConfig {
    appId: string
    appSecret: string
    accessToken?: string
}

interface InstagramPost {
    caption: string
    image_url?: string
    video_url?: string
    is_carousel_item?: boolean
    children?: string[] // For carousel posts
}

interface FacebookPost {
    message: string
    link?: string
    picture?: string
    name?: string
    description?: string
}

interface PostResult {
    id: string
    post_id?: string
}

export class MetaService {
    private config: MetaConfig
    private baseUrl = 'https://graph.facebook.com/v19.0'

    constructor(config: MetaConfig) {
        this.config = config
    }

    // Get user's Instagram business account
    async getInstagramBusinessAccount(accessToken: string): Promise<any> {
        try {
            const response = await fetch(
                `${this.baseUrl}/me/accounts?fields=instagram_business_account&access_token=${accessToken}`
            )
            const data = await response.json()

            if (data.error) {
                throw new Error(`Meta API Error: ${data.error.message}`)
            }

            // Find the first page with an Instagram business account
            const pageWithInstagram = data.data?.find((page: any) => page.instagram_business_account)
            return pageWithInstagram?.instagram_business_account
        } catch (error) {
            console.error('Get Instagram business account error:', error)
            throw error
        }
    }

    // Get user's Facebook pages
    async getFacebookPages(accessToken: string): Promise<any[]> {
        try {
            const response = await fetch(
                `${this.baseUrl}/me/accounts?fields=id,name,access_token&access_token=${accessToken}`
            )
            const data = await response.json()

            if (data.error) {
                throw new Error(`Meta API Error: ${data.error.message}`)
            }

            return data.data || []
        } catch (error) {
            console.error('Get Facebook pages error:', error)
            throw error
        }
    }

    // Post to Instagram
    async postToInstagram(
        instagramAccountId: string,
        accessToken: string,
        post: InstagramPost
    ): Promise<PostResult> {
        try {
            // Step 1: Create media container
            const containerResponse = await fetch(
                `${this.baseUrl}/${instagramAccountId}/media`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        caption: post.caption,
                        image_url: post.image_url,
                        video_url: post.video_url,
                        media_type: post.video_url ? 'VIDEO' : 'IMAGE',
                        access_token: accessToken
                    })
                }
            )

            const containerData = await containerResponse.json()

            if (containerData.error) {
                throw new Error(`Instagram API Error: ${containerData.error.message}`)
            }

            // Step 2: Publish the media
            const publishResponse = await fetch(
                `${this.baseUrl}/${instagramAccountId}/media_publish`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        creation_id: containerData.id,
                        access_token: accessToken
                    })
                }
            )

            const publishData = await publishResponse.json()

            if (publishData.error) {
                throw new Error(`Instagram Publish Error: ${publishData.error.message}`)
            }

            return {
                id: publishData.id,
                post_id: publishData.id
            }
        } catch (error) {
            console.error('Post to Instagram error:', error)
            throw error
        }
    }

    // Post to Facebook
    async postToFacebook(
        pageId: string,
        pageAccessToken: string,
        post: FacebookPost
    ): Promise<PostResult> {
        try {
            const response = await fetch(
                `${this.baseUrl}/${pageId}/feed`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: post.message,
                        link: post.link,
                        picture: post.picture,
                        name: post.name,
                        description: post.description,
                        access_token: pageAccessToken
                    })
                }
            )

            const data = await response.json()

            if (data.error) {
                throw new Error(`Facebook API Error: ${data.error.message}`)
            }

            return {
                id: data.id,
                post_id: data.id
            }
        } catch (error) {
            console.error('Post to Facebook error:', error)
            throw error
        }
    }

    // Schedule a post (Note: This requires additional Meta approval for publishing_to_instagram)
    async schedulePost(
        accountId: string,
        accessToken: string,
        post: InstagramPost | FacebookPost,
        publishTime: Date,
        platform: 'INSTAGRAM' | 'FACEBOOK'
    ): Promise<PostResult> {
        const publishTimestamp = Math.floor(publishTime.getTime() / 1000)

        try {
            if (platform === 'INSTAGRAM') {
                // For Instagram, we create a media container and schedule it
                const response = await fetch(
                    `${this.baseUrl}/${accountId}/media`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            ...(post as InstagramPost),
                            published: false,
                            scheduled_publish_time: publishTimestamp,
                            access_token: accessToken
                        })
                    }
                )

                const data = await response.json()

                if (data.error) {
                    throw new Error(`Instagram Schedule Error: ${data.error.message}`)
                }

                return { id: data.id }
            } else {
                // For Facebook, we can schedule posts directly
                const response = await fetch(
                    `${this.baseUrl}/${accountId}/feed`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            ...(post as FacebookPost),
                            published: false,
                            scheduled_publish_time: publishTimestamp,
                            access_token: accessToken
                        })
                    }
                )

                const data = await response.json()

                if (data.error) {
                    throw new Error(`Facebook Schedule Error: ${data.error.message}`)
                }

                return { id: data.id }
            }
        } catch (error) {
            console.error('Schedule post error:', error)
            throw error
        }
    }

    // Get post insights/analytics
    async getPostInsights(postId: string, accessToken: string): Promise<any> {
        try {
            const response = await fetch(
                `${this.baseUrl}/${postId}/insights?metric=engagement,impressions,reach&access_token=${accessToken}`
            )
            const data = await response.json()

            if (data.error) {
                throw new Error(`Meta Insights Error: ${data.error.message}`)
            }

            return data.data
        } catch (error) {
            console.error('Get post insights error:', error)
            throw error
        }
    }

    // Validate access token
    async validateAccessToken(accessToken: string): Promise<boolean> {
        try {
            const response = await fetch(
                `${this.baseUrl}/me?access_token=${accessToken}`
            )
            const data = await response.json()

            return !data.error
        } catch (error) {
            return false
        }
    }

    // Generate OAuth URL for user authentication
    static generateOAuthUrl(appId: string, redirectUri: string, state?: string): string {
        const scopes = [
            'pages_show_list',
            'pages_read_engagement',
            'pages_manage_posts',
            'instagram_basic',
            'instagram_content_publish'
        ].join(',')

        const params = new URLSearchParams({
            client_id: appId,
            redirect_uri: redirectUri,
            scope: scopes,
            response_type: 'code',
            ...(state && { state })
        })

        return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`
    }

    // Exchange authorization code for access token
    static async exchangeCodeForToken(
        appId: string,
        appSecret: string,
        code: string,
        redirectUri: string
    ): Promise<{ access_token: string; token_type: string; expires_in?: number }> {
        try {
            const response = await fetch(
                `https://graph.facebook.com/v19.0/oauth/access_token?` +
                `client_id=${appId}&` +
                `redirect_uri=${encodeURIComponent(redirectUri)}&` +
                `client_secret=${appSecret}&` +
                `code=${code}`
            )

            const data = await response.json()

            if (data.error) {
                throw new Error(`OAuth Error: ${data.error.message}`)
            }

            return data
        } catch (error) {
            console.error('Exchange code for token error:', error)
            throw error
        }
    }

    // Save user's social account to database
    static async saveSocialAccount(
        userId: string,
        platform: 'FACEBOOK' | 'INSTAGRAM',
        accountData: {
            accountId: string
            username: string
            accessToken: string
            refreshToken?: string
            tokenExpiry?: Date
        }
    ): Promise<void> {
        await prisma.socialAccount.upsert({
            where: {
                userId_platform_accountId: {
                    userId,
                    platform,
                    accountId: accountData.accountId
                }
            },
            update: {
                username: accountData.username,
                accessToken: accountData.accessToken, // Should encrypt in production
                refreshToken: accountData.refreshToken,
                tokenExpiry: accountData.tokenExpiry,
                isActive: true,
                updatedAt: new Date()
            },
            create: {
                userId,
                platform,
                accountId: accountData.accountId,
                username: accountData.username,
                accessToken: accountData.accessToken, // Should encrypt in production
                refreshToken: accountData.refreshToken,
                tokenExpiry: accountData.tokenExpiry,
                isActive: true
            }
        })
    }
}

export default MetaService