import { GoogleGenerativeAI } from '@google/generative-ai'
import { prisma } from '@/lib/prisma'

interface PostGenerationRequest {
    userId: string
    prompt: string
    brandTone: string[]
    platform: 'INSTAGRAM' | 'FACEBOOK' | 'TWITTER' | 'TIKTOK' | 'YOUTUBE_SHORTS' | 'LINKEDIN'
    format: 'SQUARE' | 'VERTICAL' | 'HORIZONTAL' | 'CAROUSEL' | 'REEL' | 'STORY'
    contentType: 'product_showcase' | 'brand_awareness' | 'educational' | 'behind_scenes' | 'user_generated'
    additionalContext?: string
}

interface GeneratedPostContent {
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

export class GeminiService {
    private genAI: GoogleGenerativeAI
    private model: any

    constructor(apiKey?: string) {
        const key = apiKey || process.env.GOOGLE_AI_API_KEY
        if (!key) {
            throw new Error('Google AI API key is required')
        }
        this.genAI = new GoogleGenerativeAI(key)
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    }

    async generatePostContent(request: PostGenerationRequest): Promise<GeneratedPostContent> {
        const prompt = this.buildPrompt(request)

        try {
            const result = await this.model.generateContent(prompt)
            const response = await result.response
            const text = response.text()

            // Log the generation for tracking
            await this.logGeneration(request.userId, prompt, text)

            return this.parsePostContent(text, request.platform, request.format)
        } catch (error) {
            console.error('Gemini generation error:', error)
            throw new Error('Failed to generate content with Gemini')
        }
    }

    private buildPrompt(request: PostGenerationRequest): string {
        const toneDescription = request.brandTone.join(', ')
        const platformRequirements = this.getPlatformRequirements(request.platform)
        const formatRequirements = this.getFormatRequirements(request.format)

        return `Create a social media post with the following requirements:

User Request: ${request.prompt}
Platform: ${request.platform}
Format: ${request.format}
Content Type: ${request.contentType}
Brand Tone: ${toneDescription}
${request.additionalContext ? `Additional Context: ${request.additionalContext}` : ''}

Platform Requirements: ${platformRequirements}
Format Requirements: ${formatRequirements}

Please provide a JSON response with the following structure:
{
  \"title\": \"Post title (max 100 characters)\",
  \"headline\": \"Main headline (attention-grabbing, max 60 characters)\",
  \"subhead\": \"Optional subheading (max 80 characters)\",
  \"caption\": \"Full post caption (engaging, platform-appropriate length)\",
  \"hashtags\": [\"#relevant\", \"#hashtags\", \"#here\"],
  \"cta\": \"Clear call-to-action (max 30 characters)\",
  \"visualBrief\": {
    \"style\": \"modern|minimal|bold|playful|elegant\",
    \"colors\": [\"#hexcolor1\", \"#hexcolor2\", \"#hexcolor3\"],
    \"imagery\": \"product|lifestyle|abstract|geometric|photography\"
  },
  \"altText\": \"Descriptive alt text for accessibility (max 200 characters)\"
}

Ensure the content is engaging, brand-appropriate, and optimized for ${request.platform}.`
    }

    private getPlatformRequirements(platform: string): string {
        const requirements = {
            INSTAGRAM: 'Visual-first, hashtag-friendly, stories/reels optimized, max 2200 chars',
            FACEBOOK: 'Community-focused, link-friendly, longer captions ok, max 63206 chars',
            TWITTER: 'Concise, trending topics, thread-friendly, max 280 chars',
            TIKTOK: 'Trendy, youth-focused, video-first, max 2200 chars',
            YOUTUBE_SHORTS: 'Video-focused, descriptive titles, max 100 chars title',
            LINKEDIN: 'Professional, industry-focused, thought leadership, max 3000 chars'
        }
        return requirements[platform as keyof typeof requirements] || ''
    }

    private getFormatRequirements(format: string): string {
        const requirements = {
            SQUARE: '1:1 aspect ratio, centered composition',
            VERTICAL: '9:16 aspect ratio, mobile-optimized',
            HORIZONTAL: '16:9 aspect ratio, landscape orientation',
            CAROUSEL: 'Multiple slides, storytelling sequence',
            REEL: 'Short-form video, trending audio',
            STORY: 'Temporary content, interactive elements'
        }
        return requirements[format as keyof typeof requirements] || ''
    }

    private async parsePostContent(text: string, platform: string, format: string): Promise<GeneratedPostContent> {
        try {
            // Try to extract JSON from the response
            const jsonMatch = text.match(/\\{[\\s\\S]*\\}/)
            if (!jsonMatch) {
                throw new Error('No JSON found in response')
            }

            const parsed = JSON.parse(jsonMatch[0])

            // Ensure all required fields exist with defaults
            return {
                title: parsed.title || 'Generated Post',
                platform: platform,
                format: format,
                headline: parsed.headline || parsed.title || 'Check this out!',
                subhead: parsed.subhead || undefined,
                caption: parsed.caption || 'Great content coming your way!',
                hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : ['#content'],
                cta: parsed.cta || 'Learn more',
                visualBrief: {
                    style: parsed.visualBrief?.style || 'modern',
                    colors: Array.isArray(parsed.visualBrief?.colors) ? parsed.visualBrief.colors : ['#3B82F6', '#10B981', '#F59E0B'],
                    imagery: parsed.visualBrief?.imagery || 'lifestyle'
                },
                altText: parsed.altText || 'Social media post image'
            }
        } catch (error) {
            console.error('Failed to parse Gemini response:', error)
            // Return a fallback response
            return {
                title: 'Generated Post',
                platform: platform,
                format: format,
                headline: 'Amazing content awaits!',
                caption: 'Check out this great content we have for you!',
                hashtags: ['#content', '#socialmedia', '#awesome'],
                cta: 'Learn more',
                visualBrief: {
                    style: 'modern',
                    colors: ['#3B82F6', '#10B981', '#F59E0B'],
                    imagery: 'lifestyle'
                },
                altText: 'Engaging social media post image'
            }
        }
    }

    private async logGeneration(userId: string, prompt: string, response: string): Promise<void> {
        try {
            await prisma.contentGeneration.create({
                data: {
                    userId,
                    prompt,
                    response: { text: response },
                    tokensUsed: Math.floor(response.length / 4), // Rough estimate
                    provider: 'gemini',
                    model: 'gemini-1.5-flash'
                }
            })
        } catch (error) {
            console.error('Failed to log content generation:', error)
        }
    }
}

export default GeminiService