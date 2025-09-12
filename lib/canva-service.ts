import axios, { AxiosInstance } from 'axios'
import { prisma } from '@/lib/prisma'

export interface CanvaAuthConfig {
    clientId: string
    clientSecret: string
    redirectUri: string
}

export interface CanvaDesignRequest {
    templateId: string
    brandKit: {
        colors: string[]
        fonts?: string[]
        logoUrl?: string
    }
    content: {
        headline?: string
        subhead?: string
        bodyText?: string
        logoPlacement?: boolean
    }
    format: {
        width: number
        height: number
        format: string
    }
}

export interface CanvaExportRequest {
    designId: string
    format: 'PNG' | 'JPG' | 'PDF' | 'MP4'
    quality: 'STANDARD' | 'HIGH'
    pages?: number[]
}

export class CanvaService {
    private static baseURL = 'https://api.canva.com/rest/v1'
    private axiosInstance: AxiosInstance

    constructor(private accessToken: string) {
        this.axiosInstance = axios.create({
            baseURL: CanvaService.baseURL,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        })
    }

    // OAuth 2.0 Authorization URL
    static getAuthorizationUrl(config: CanvaAuthConfig, state?: string): string {
        const params = new URLSearchParams({
            client_id: config.clientId,
            response_type: 'code',
            redirect_uri: config.redirectUri,
            scope: 'design:read design:write brand:read folder:read asset:read asset:write',
            state: state || '',
        })

        return `https://www.canva.com/api/oauth/authorize?${params.toString()}`
    }

    // Exchange authorization code for access token
    static async getAccessToken(
        config: CanvaAuthConfig,
        authorizationCode: string
    ): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
        try {
            const response = await axios.post('https://api.canva.com/rest/v1/oauth/token', {
                grant_type: 'authorization_code',
                client_id: config.clientId,
                client_secret: config.clientSecret,
                redirect_uri: config.redirectUri,
                code: authorizationCode,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                }
            })

            return response.data
        } catch (error: any) {
            console.error('Canva token exchange error:', error.response?.data || error.message)
            throw new Error('Failed to exchange authorization code for access token')
        }
    }

    // Get user profile
    async getUserProfile(): Promise<any> {
        try {
            const response = await this.axiosInstance.get('/users/me')
            return response.data
        } catch (error) {
            console.error('Get user profile error:', error)
            throw error
        }
    }

    // Get brand templates
    async getBrandTemplates(brandId?: string): Promise<any[]> {
        try {
            const params = brandId ? { brand_id: brandId } : {}
            const response = await this.axiosInstance.get('/brand-templates', { params })
            return response.data.items || []
        } catch (error) {
            console.error('Get brand templates error:', error)
            throw error
        }
    }

    // Create design from template using Autofill API
    async createDesignFromTemplate(request: CanvaDesignRequest): Promise<{ designId: string; editUrl: string }> {
        try {
            const autofillData = this.buildAutofillData(request)

            const response = await this.axiosInstance.post('/autofills', {
                brand_template_id: request.templateId,
                data: autofillData,
            })

            const autofillJob = response.data

            // Poll for completion
            const designId = await this.pollAutofillJob(autofillJob.job.id)

            // Get edit URL
            const editResponse = await this.axiosInstance.get(`/designs/${designId}`)
            const editUrl = editResponse.data.urls?.edit_url

            return {
                designId,
                editUrl: editUrl || `https://www.canva.com/design/${designId}`
            }

        } catch (error: any) {
            console.error('Create design error:', error.response?.data || error.message)
            throw new Error('Failed to create design from template')
        }
    }

    // Export design to various formats
    async exportDesign(request: CanvaExportRequest): Promise<{ exportUrl: string; downloadUrl: string }> {
        try {
            const response = await this.axiosInstance.post(`/designs/${request.designId}/export`, {
                format: {
                    type: request.format,
                    quality: request.quality,
                },
                pages: request.pages,
            })

            const exportJob = response.data

            // Poll for completion
            const exportResult = await this.pollExportJob(exportJob.job.id)

            return {
                exportUrl: exportResult.url,
                downloadUrl: exportResult.url,
            }

        } catch (error: any) {
            console.error('Export design error:', error.response?.data || error.message)
            throw new Error('Failed to export design')
        }
    }

    // Get design details
    async getDesign(designId: string): Promise<any> {
        try {
            const response = await this.axiosInstance.get(`/designs/${designId}`)
            return response.data
        } catch (error) {
            console.error('Get design error:', error)
            throw error
        }
    }

    // Upload asset (logo, images)
    async uploadAsset(fileUrl: string, fileName: string): Promise<{ assetId: string; assetUrl: string }> {
        try {
            const response = await this.axiosInstance.post('/assets/upload', {
                type: 'UPLOAD',
                name: fileName,
                upload_url: fileUrl,
            })

            const uploadJob = response.data
            const assetResult = await this.pollUploadJob(uploadJob.job.id)

            return {
                assetId: assetResult.asset.id,
                assetUrl: assetResult.asset.url,
            }

        } catch (error: any) {
            console.error('Upload asset error:', error.response?.data || error.message)
            throw new Error('Failed to upload asset')
        }
    }

    // Private helper methods
    private buildAutofillData(request: CanvaDesignRequest): any {
        const data: any = {}

        // Add text content
        if (request.content.headline) {
            data.headline = { text: request.content.headline }
        }
        if (request.content.subhead) {
            data.subhead = { text: request.content.subhead }
        }
        if (request.content.bodyText) {
            data.body_text = { text: request.content.bodyText }
        }

        // Add brand colors
        if (request.brandKit.colors.length > 0) {
            data.brand_colors = request.brandKit.colors.map((color, index) => ({
                [`color_${index + 1}`]: color
            })).reduce((acc, curr) => ({ ...acc, ...curr }), {})
        }

        // Add logo if provided
        if (request.brandKit.logoUrl && request.content.logoPlacement) {
            data.logo = { url: request.brandKit.logoUrl }
        }

        return data
    }

    private async pollAutofillJob(jobId: string, maxAttempts: number = 30): Promise<string> {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                const response = await this.axiosInstance.get(`/autofills/${jobId}`)
                const job = response.data.job

                if (job.status === 'success') {
                    return job.result.design.id
                } else if (job.status === 'failed') {
                    throw new Error('Autofill job failed')
                }

                // Wait before next poll
                await new Promise(resolve => setTimeout(resolve, 2000))
            } catch (error) {
                console.error(`Autofill poll attempt ${attempt + 1} failed:`, error)
                if (attempt === maxAttempts - 1) throw error
            }
        }

        throw new Error('Autofill job timed out')
    }

    private async pollExportJob(jobId: string, maxAttempts: number = 30): Promise<any> {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                const response = await this.axiosInstance.get(`/exports/${jobId}`)
                const job = response.data.job

                if (job.status === 'success') {
                    return job.result
                } else if (job.status === 'failed') {
                    throw new Error('Export job failed')
                }

                // Wait before next poll
                await new Promise(resolve => setTimeout(resolve, 2000))
            } catch (error) {
                console.error(`Export poll attempt ${attempt + 1} failed:`, error)
                if (attempt === maxAttempts - 1) throw error
            }
        }

        throw new Error('Export job timed out')
    }

    private async pollUploadJob(jobId: string, maxAttempts: number = 30): Promise<any> {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                const response = await this.axiosInstance.get(`/uploads/${jobId}`)
                const job = response.data.job

                if (job.status === 'success') {
                    return job.result
                } else if (job.status === 'failed') {
                    throw new Error('Upload job failed')
                }

                // Wait before next poll
                await new Promise(resolve => setTimeout(resolve, 2000))
            } catch (error) {
                console.error(`Upload poll attempt ${attempt + 1} failed:`, error)
                if (attempt === maxAttempts - 1) throw error
            }
        }

        throw new Error('Upload job timed out')
    }

    // Utility method to get format dimensions
    static getFormatDimensions(format: string, platform: string): { width: number; height: number } {
        const dimensions: Record<string, Record<string, { width: number; height: number }>> = {
            INSTAGRAM: {
                SQUARE: { width: 1080, height: 1080 },
                VERTICAL: { width: 1080, height: 1920 },
                HORIZONTAL: { width: 1080, height: 566 },
            },
            FACEBOOK: {
                SQUARE: { width: 1200, height: 1200 },
                HORIZONTAL: { width: 1200, height: 630 },
            },
            TWITTER: {
                HORIZONTAL: { width: 1200, height: 675 },
                SQUARE: { width: 1200, height: 1200 },
            },
            LINKEDIN: {
                HORIZONTAL: { width: 1200, height: 627 },
                SQUARE: { width: 1080, height: 1080 },
            },
        }

        return dimensions[platform]?.[format] || { width: 1080, height: 1080 }
    }
}