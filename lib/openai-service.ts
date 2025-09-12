import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

export interface PostGenerationRequest {
    companyId: string
    companyName: string
    companyDescription: string
    brandTone: string[]
    brandColors: {
        primary: string
        secondary: string
        accent: string
    }
    contentType: 'product_showcase' | 'brand_awareness' | 'educational' | 'behind_scenes' | 'user_generated'
    platform: 'INSTAGRAM' | 'FACEBOOK' | 'TWITTER' | 'TIKTOK' | 'YOUTUBE_SHORTS' | 'LINKEDIN'
    format: 'SQUARE' | 'VERTICAL' | 'HORIZONTAL' | 'CAROUSEL' | 'REEL' | 'STORY'
    productContext?: {
        title: string
        description: string
        features: string[]
        price: number
        currency: string
    }
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
    productRef?: string
    altText: string
}

export class OpenAIService {

    static async generatePostContent(request: PostGenerationRequest): Promise<GeneratedPostContent> {
        const prompt = this.buildPrompt(request)

        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    {
                        role: "system",
                        content: `You are an expert social media marketing assistant specializing in creating engaging, on-brand content. 
            You must return a valid JSON object that matches the exact structure specified in the user prompt. 
            Focus on creating content that is authentic, engaging, and optimized for the specified platform.
            
            Key guidelines:
            - Match the brand tone and voice exactly
            - Use platform-specific best practices
            - Include relevant hashtags (platform appropriate counts)
            - Create compelling calls-to-action
            - Ensure accessibility with descriptive alt text
            - Follow character limits for each platform`
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 2000,
                response_format: { type: "json_object" }
            })

            const response = completion.choices[0]?.message?.content
            if (!response) {
                throw new Error('No response from OpenAI')
            }

            const generatedContent = JSON.parse(response) as GeneratedPostContent

            // Log the generation for analytics
            await this.logGeneration(request.companyId, prompt, generatedContent, completion.usage?.total_tokens || 0)

            return generatedContent

        } catch (error: any) {
            console.error('OpenAI generation error:', error)
            throw new Error(`Content generation failed: ${error.message}`)
        }
    }

    static async generateMultiplePosts(
        request: PostGenerationRequest,
        count: number
    ): Promise<GeneratedPostContent[]> {
        const posts: GeneratedPostContent[] = []

        // Generate posts with slight variations
        for (let i = 0; i < count; i++) {
            const modifiedRequest = {
                ...request,
                additionalContext: `${request.additionalContext || ''} [Variation ${i + 1} of ${count} - make this unique while maintaining brand consistency]`
            }

            const post = await this.generatePostContent(modifiedRequest)
            posts.push(post)

            // Small delay to avoid rate limiting
            if (i < count - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000))
            }
        }

        return posts
    }

    private static buildPrompt(request: PostGenerationRequest): string {
        const platformSpecs = this.getPlatformSpecifications(request.platform, request.format)

        return `Generate social media content for the following brand and requirements:

BRAND INFORMATION:
- Company: ${request.companyName}
- Description: ${request.companyDescription}
- Brand Tone: ${request.brandTone.join(', ')}
- Brand Colors: Primary ${request.brandColors.primary}, Secondary ${request.brandColors.secondary}, Accent ${request.brandColors.accent}

CONTENT REQUIREMENTS:
- Content Type: ${request.contentType}
- Platform: ${request.platform}
- Format: ${request.format}
${request.productContext ? `
PRODUCT CONTEXT:
- Product: ${request.productContext.title}
- Description: ${request.productContext.description}
- Key Features: ${request.productContext.features.join(', ')}
- Price: ${request.productContext.price} ${request.productContext.currency}
` : ''}

PLATFORM SPECIFICATIONS:
${platformSpecs}

${request.additionalContext ? `ADDITIONAL CONTEXT: ${request.additionalContext}` : ''}

Generate a JSON response with this exact structure:
{
  "title": "Engaging post title (under 60 characters)",
  "platform": "${request.platform}",
  "format": "${request.format}",
  "headline": "Main headline text (platform appropriate length)",
  "subhead": "Supporting text (optional, can be null)",
  "caption": "Full post caption (following platform character limits and best practices)",
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"],
  "cta": "Clear call to action",
  "visualBrief": {
    "style": "modern|minimal|bold|playful|elegant",
    "colors": ["${request.brandColors.primary}", "${request.brandColors.secondary}"],
    "imagery": "product|lifestyle|abstract|geometric|photography"
  },
  ${request.productContext ? `"productRef": "product_reference_id",` : `"productRef": null,`}
  "altText": "Descriptive alt text for accessibility (minimum 10 words)"
}`
    }

    private static getPlatformSpecifications(platform: string, format: string): string {
        const specs: Record<string, Record<string, string>> = {
            INSTAGRAM: {
                SQUARE: "Caption: up to 2,200 chars, Hashtags: 3-5 relevant ones, Focus: Visual storytelling",
                VERTICAL: "Stories/Reels format, Caption: concise, Hashtags: 3-5, Include story engagement elements",
                CAROUSEL: "Multi-slide content, Caption: detailed storytelling, Hashtags: 5-10, Sequential narrative"
            },
            FACEBOOK: {
                SQUARE: "Caption: 40-80 chars for optimal engagement, Focus: Community building",
                HORIZONTAL: "Link preview optimized, Caption: conversational tone, Ask questions"
            },
            TWITTER: {
                SQUARE: "Tweet: 280 chars max, Hashtags: 1-2 max, Focus: conversation starters",
                HORIZONTAL: "Image optimized for timeline, Concise and punchy copy"
            },
            LINKEDIN: {
                SQUARE: "Professional tone, Caption: thought leadership, Hashtags: 3-5 industry specific",
                HORIZONTAL: "Business focused, Data-driven content, Professional insights"
            }
        }

        return specs[platform]?.[format] || "Standard social media best practices apply"
    }

    private static async logGeneration(
        companyId: string,
        prompt: string,
        response: GeneratedPostContent,
        tokensUsed: number
    ): Promise<void> {
        try {
            await prisma.contentGeneration.create({
                data: {
                    companyId,
                    prompt,
                    response: response as any,
                    tokensUsed,
                    provider: 'openai',
                    model: 'gpt-4-turbo-preview'
                }
            })
        } catch (error) {
            console.error('Failed to log content generation:', error)
            // Don't throw here - logging failure shouldn't break generation
        }
    }

    static async analyzeContent(content: string, type: 'brand_voice' | 'product' | 'competitor'): Promise<any> {
        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    {
                        role: "system",
                        content: `You are a content analysis expert. Analyze the provided ${type} content and extract key insights, tone, messaging patterns, and recommendations.`
                    },
                    {
                        role: "user",
                        content: `Analyze this ${type} content and provide insights: ${content}`
                    }
                ],
                temperature: 0.3,
                max_tokens: 1000,
                response_format: { type: "json_object" }
            })

            return JSON.parse(completion.choices[0]?.message?.content || '{}')
        } catch (error) {
            console.error('Content analysis error:', error)
            throw error
        }
    }
}