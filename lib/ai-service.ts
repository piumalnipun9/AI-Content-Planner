import { GeminiService } from './gemini-service'
import { prisma } from './prisma'

export type AIProvider = 'GEMINI'

// Re-export types from gemini-service
export interface PostGenerationRequest {
    userId: string
    prompt: string
    brandTone: string[]
    platform: 'INSTAGRAM' | 'FACEBOOK' | 'TWITTER' | 'TIKTOK' | 'YOUTUBE_SHORTS' | 'LINKEDIN'
    format: 'SQUARE' | 'VERTICAL' | 'HORIZONTAL' | 'CAROUSEL' | 'REEL' | 'STORY'
    contentType: 'product_showcase' | 'brand_awareness' | 'educational' | 'behind_scenes' | 'user_generated'
    additionalContext?: string
}

export interface GeneratedPostContent {
    title: string
    platform: string
    format: string
    headline: string
    subhead?: string
    caption: string
    hashtags: string[]
    cta: string
    visualBrief: {
        style: 'modern' | 'minimal' | 'bold' | 'playful' | 'elegant'
        colors: string[]
        imagery: 'product' | 'lifestyle' | 'abstract' | 'geometric' | 'photography'
    }
    altText: string
}

interface AIServiceConfig {
    provider: AIProvider
    apiKey?: string
}

export class AIService {
    private static async getUserApiKey(userId: string, provider: AIProvider): Promise<string | null> {
        const apiKey = await prisma.apiKey.findFirst({
            where: {
                userId,
                provider,
                isActive: true
            }
        })
        return apiKey?.keyValue || null
    }

    static async generatePostContent(
        request: PostGenerationRequest,
        provider: AIProvider = 'GEMINI'
    ): Promise<GeneratedPostContent> {
        // Try to get user's API key first, fallback to environment variables
        const userApiKey = await this.getUserApiKey(request.userId, provider)

        try {
            const geminiService = new GeminiService(userApiKey || undefined)
            return await geminiService.generatePostContent(request)
        } catch (error: any) {
            console.error('Gemini generation failed:', error)
            throw error
        }
    }

    static async generateMultiplePosts(
        request: PostGenerationRequest,
        count: number,
        provider: AIProvider = 'GEMINI'
    ): Promise<GeneratedPostContent[]> {
        const posts: GeneratedPostContent[] = []

        for (let i = 0; i < count; i++) {
            const modifiedRequest = {
                ...request,
                additionalContext: `${request.additionalContext || ''} [Variation ${i + 1} of ${count} - make this unique while maintaining consistency]`
            }

            const post = await this.generatePostContent(modifiedRequest, provider)
            posts.push(post)

            // Small delay to avoid rate limiting
            if (i < count - 1) {
                await new Promise(resolve => setTimeout(resolve, 1500))
            }
        }

        return posts
    }

    static getAvailableProviders(): Promise<AIProvider[]> {
        const providers: AIProvider[] = []

        if (process.env.GEMINI_API_KEY) {
            providers.push('GEMINI')
        }

        return Promise.resolve(providers)
    }

    static async saveUserApiKey(
        userId: string,
        provider: AIProvider,
        keyName: string,
        keyValue: string
    ): Promise<void> {
        await prisma.apiKey.upsert({
            where: {
                userId_provider: {
                    userId,
                    provider
                }
            },
            update: {
                keyName,
                keyValue, // In production, encrypt this
                isActive: true,
                updatedAt: new Date()
            },
            create: {
                userId,
                provider,
                keyName,
                keyValue, // In production, encrypt this
                isActive: true
            }
        })
    }
}

export default AIService
export type { PostGenerationRequest, GeneratedPostContent }