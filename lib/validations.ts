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

// Company schemas
export const createCompanySchema = z.object({
    name: z.string().min(2, 'Company name must be at least 2 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    tone: z.array(z.string()).min(1, 'At least one tone must be selected'),
    brandKit: z.object({
        primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color'),
        secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color'),
        accentColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color'),
        logoUrl: z.string().url('Invalid logo URL').optional(),
        fonts: z.object({
            primary: z.string(),
            secondary: z.string().optional(),
        }),
    }),
})

export const updateCompanySchema = createCompanySchema.partial()

// Product schemas
export const createProductSchema = z.object({
    sku: z.string().min(1, 'SKU is required'),
    title: z.string().min(2, 'Product title must be at least 2 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    price: z.number().positive('Price must be positive'),
    currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
    images: z.array(z.string().url('Invalid image URL')),
    features: z.array(z.string()),
    categories: z.array(z.string()),
    tags: z.array(z.string()),
})

export const updateProductSchema = createProductSchema.partial()

// Post schemas
export const PostPlatformEnum = z.enum(['INSTAGRAM', 'FACEBOOK', 'TWITTER', 'TIKTOK', 'YOUTUBE_SHORTS', 'LINKEDIN'])
export const PostFormatEnum = z.enum(['SQUARE', 'VERTICAL', 'HORIZONTAL', 'CAROUSEL', 'REEL', 'STORY'])

export const generatePostsSchema = z.object({
    companyId: z.string().cuid('Invalid company ID'),
    postCount: z.number().min(1).max(20, 'Maximum 20 posts per request'),
    platforms: z.array(PostPlatformEnum).min(1, 'At least one platform required'),
    productIds: z.array(z.string().cuid()).optional(),
    contentTypes: z.array(z.enum(['product_showcase', 'brand_awareness', 'educational', 'behind_scenes', 'user_generated'])).min(1),
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
    provider: z.enum(['openai', 'canva', 'pinecone']),
    keyName: z.string().min(2, 'Key name must be at least 2 characters'),
    keyValue: z.string().min(10, 'API key must be at least 10 characters'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CreateCompanyInput = z.infer<typeof createCompanySchema>
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>
export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type GeneratePostsInput = z.infer<typeof generatePostsSchema>
export type CreatePostInput = z.infer<typeof createPostSchema>
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>