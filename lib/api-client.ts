/**
 * API Client for Social Media Scheduler
 * Handles all API communication with type safety
 */

import { CreateCompanyInput, CreateProductInput, GeneratePostsInput } from '@/lib/validations'

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

class ApiError extends Error {
    constructor(public status: number, message: string, public data?: any) {
        super(message)
        this.name = 'ApiError'
    }
}

class ApiClient {
    private baseUrl: string
    private token: string | null = null

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl
        // Get token from localStorage if available
        if (typeof window !== 'undefined') {
            this.token = localStorage.getItem('auth_token')
        }
    }

    setToken(token: string) {
        this.token = token
        if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', token)
        }
    }

    clearToken() {
        this.token = null
        if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token')
        }
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}/api${endpoint}`

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        }

        if (this.token) {
            headers.Authorization = `Bearer ${this.token}`
        }

        const config: RequestInit = {
            ...options,
            headers,
        }

        try {
            const response = await fetch(url, config)
            const data = await response.json()

            if (!response.ok) {
                throw new ApiError(response.status, data.error || 'Request failed', data)
            }

            return data
        } catch (error) {
            if (error instanceof ApiError) {
                throw error
            }
            throw new ApiError(0, 'Network error or server is unreachable')
        }
    }

    // Auth endpoints
    async register(data: { email: string; name: string; password: string }) {
        const response = await this.request<{
            message: string
            user: { id: string; email: string; name: string }
            token: string
        }>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        })

        this.setToken(response.token)
        return response
    }

    async login(data: { email: string; password: string }) {
        const response = await this.request<{
            message: string
            user: { id: string; email: string; name: string }
            token: string
        }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(data),
        })

        this.setToken(response.token)
        return response
    }

    // Company endpoints
    async getCompanies() {
        return this.request<{
            companies: Array<{
                id: string
                name: string
                description: string
                tone: string[]
                brandKit: any
                createdAt: string
                _count: {
                    products: number
                    posts: number
                    templates: number
                }
            }>
        }>('/companies')
    }

    async createCompany(data: CreateCompanyInput) {
        return this.request<{
            message: string
            company: {
                id: string
                name: string
                description: string
                tone: string[]
                brandKit: any
                createdAt: string
            }
        }>('/companies', {
            method: 'POST',
            body: JSON.stringify(data),
        })
    }

    async getCompany(id: string) {
        return this.request<{
            company: {
                id: string
                name: string
                description: string
                tone: string[]
                brandKit: any
                createdAt: string
                products: any[]
                posts: any[]
                _count: {
                    products: number
                    posts: number
                    templates: number
                }
            }
        }>(`/companies/${id}`)
    }

    // Product endpoints
    async getProducts(companyId?: string) {
        const query = companyId ? `?companyId=${companyId}` : ''
        return this.request<{
            products: Array<{
                id: string
                sku: string
                title: string
                description: string
                price: number
                currency: string
                images: string[]
                features: string[]
                categories: string[]
                tags: string[]
                isActive: boolean
                createdAt: string
            }>
        }>(`/products${query}`)
    }

    async createProduct(data: CreateProductInput & { companyId: string }) {
        return this.request<{
            message: string
            product: {
                id: string
                sku: string
                title: string
                description: string
                price: number
                currency: string
                images: string[]
                features: string[]
                categories: string[]
                tags: string[]
                createdAt: string
            }
        }>('/products', {
            method: 'POST',
            body: JSON.stringify(data),
        })
    }

    // Posts endpoints
    async getPosts(companyId?: string) {
        const query = companyId ? `?companyId=${companyId}` : ''
        return this.request<{
            posts: Array<{
                id: string
                title: string
                platform: string
                format: string
                headline: string
                subhead?: string
                caption: string
                hashtags: string[]
                cta: string
                visualBrief: any
                altText: string
                status: string
                createdAt: string
                scheduledAt?: string
                publishedAt?: string
            }>
        }>(`/posts${query}`)
    }

    async generatePosts(data: GeneratePostsInput) {
        return this.request<{
            message: string
            posts: Array<{
                id: string
                title: string
                platform: string
                format: string
                headline: string
                caption: string
                hashtags: string[]
                cta: string
                visualBrief: any
                altText: string
                status: string
                createdAt: string
            }>
            company: {
                id: string
                name: string
            }
        }>('/content/generate', {
            method: 'POST',
            body: JSON.stringify(data),
        })
    }

    // File upload
    async uploadFile(file: File, folder: string = 'general') {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', folder)

        return this.request<{
            message: string
            url: string
            filename: string
        }>('/upload', {
            method: 'POST',
            body: formData,
            headers: {}, // Don't set Content-Type for FormData
        })
    }
}

// Create singleton instance
export const apiClient = new ApiClient()

// Export types for use in components
export type { ApiError }
export { ApiClient }