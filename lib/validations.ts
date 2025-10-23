import { z } from 'zod'

// User schemas
export const registerSchema = z.object({
    email: z.string().email('Invalid email format'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
})

// Remove company/product schemas as they're not in current schema
// Keep only the schemas that match our current database structure

// Post schemas
export const PostPlatformEnum = z.enum(['INSTAGRAM', 'FACEBOOK', 'TWITTER', 'TIKTOK', 'YOUTUBE_SHORTS', 'LINKEDIN'])
export const PostFormatEnum = z.enum(['SQUARE', 'VERTICAL', 'HORIZONTAL', 'CAROUSEL', 'REEL', 'STORY'])
export const ApiProviderEnum = z.enum(['GEMINI', 'CANVA', 'META', 'PINECONE', 'RAG'])

export const generatePostsSchema = z.object({
    postCount: z.number().min(1).max(20, 'Maximum 20 posts per request'),
    platforms: z.array(PostPlatformEnum).min(1, 'At least one platform required'),
    contentTypes: z.array(z.enum(['product_showcase', 'brand_awareness', 'educational', 'behind_scenes', 'user_generated'])).min(1),
    prompt: z.string().min(10, 'Prompt must be at least 10 characters'),
    brandTone: z.array(z.string()).default(['professional', 'friendly']),
    aiProvider: ApiProviderEnum.default('GEMINI'),
    useRag: z.boolean().optional().default(false)
})

export const createPostSchema = z.object({
    title: z.string().min(2, 'Title must be at least 2 characters'),
    platform: PostPlatformEnum,
    format: PostFormatEnum,
    headline: z.string().min(5, 'Headline must be at least 5 characters'),
    subhead: z.string().optional(),
    caption: z.string().min(10, 'Caption must be at least 10 characters'),
    hashtags: z.array(z.string().regex(/^#\w+$/, 'Invalid hashtag format')),
    cta: z.string().min(5, 'CTA must be at least 5 characters'),
    visualBrief: z.object({
        style: z.enum(['modern', 'minimal', 'bold', 'playful', 'elegant']),
        colors: z.array(z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color')),
        imagery: z.enum(['product', 'lifestyle', 'abstract', 'geometric', 'photography']),
    }),
    productRef: z.string().cuid().optional(),
    altText: z.string().min(10, 'Alt text must be at least 10 characters'),
})

// Template schemas
export const createTemplateSchema = z.object({
    canvaId: z.string().min(1, 'Canva ID is required'),
    name: z.string().min(2, 'Template name must be at least 2 characters'),
    format: PostFormatEnum,
    platforms: z.array(PostPlatformEnum).min(1, 'At least one platform required'),
    previewUrl: z.string().url('Invalid preview URL'),
})

// API Key schemas
export const createApiKeySchema = z.object({
    provider: ApiProviderEnum,
    keyName: z.string().min(2, 'Key name must be at least 2 characters'),
    keyValue: z.string().min(10, 'API key must be at least 10 characters'),
})

// Social Account schemas
export const createSocialAccountSchema = z.object({
    platform: PostPlatformEnum,
    accountId: z.string().min(1, 'Account ID is required'),
    username: z.string().min(1, 'Username is required'),
    accessToken: z.string().min(10, 'Access token is required'),
    refreshToken: z.string().optional(),
    tokenExpiry: z.date().optional(),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type GeneratePostsInput = z.infer<typeof generatePostsSchema>
export type CreatePostInput = z.infer<typeof createPostSchema>
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>
export type CreateSocialAccountInput = z.infer<typeof createSocialAccountSchema>

// RAG-specific schemas
export const ragIngestSchema = z.object({
    text: z.string().min(50, 'Provide at least 50 characters of brand text'),
    metadata: z.record(z.any()).optional(),
})

export const ragGenerateSchema = z.object({
    prompt: z.string().min(10),
    platform: PostPlatformEnum,
    contentType: z.enum(['product_showcase', 'brand_awareness', 'educational', 'behind_scenes', 'user_generated']),
    format: PostFormatEnum,
    brandTone: z.array(z.string()).default(['professional', 'friendly']),
    topK: z.number().min(1).max(8).default(4)
})