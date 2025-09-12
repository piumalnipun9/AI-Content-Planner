"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
    Sparkles,
    Settings,
    Plus,
    Download,
    ExternalLink,
    RefreshCw,
    Instagram,
    Facebook,
    Twitter,
    Linkedin,
    Eye,
    Calendar,
    Clock,
    Loader2,
    CheckCircle,
    Copy,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"

const generateSchema = z.object({
    companyId: z.string().min(1, "Please select a company"),
    postCount: z.number().min(1).max(20, "Maximum 20 posts per request"),
    platforms: z.array(z.string()).min(1, "Select at least one platform"),
    contentTypes: z.array(z.string()).min(1, "Select at least one content type"),
    productIds: z.array(z.string()).optional(),
    additionalInstructions: z.string().optional(),
})

type GenerateFormData = z.infer<typeof generateSchema>

interface GeneratedPost {
    id: string
    title: string
    platform: string
    format: string
    headline: string
    subhead?: string
    caption: string
    hashtags: string[]
    cta: string
    visualBrief: {
        style: string
        colors: string[]
        imagery: string
    }
    altText: string
    designId?: string
    exportUrls: string[]
    createdAt: string
}

const platformOptions = [
    { value: "INSTAGRAM", label: "Instagram", icon: Instagram, color: "bg-gradient-to-r from-purple-500 to-pink-500" },
    { value: "FACEBOOK", label: "Facebook", icon: Facebook, color: "bg-blue-600" },
    { value: "TWITTER", label: "Twitter", icon: Twitter, color: "bg-blue-500" },
    { value: "LINKEDIN", label: "LinkedIn", icon: Linkedin, color: "bg-blue-700" },
]

const contentTypeOptions = [
    { value: "product_showcase", label: "Product Showcase", description: "Highlight specific products or services" },
    { value: "brand_awareness", label: "Brand Awareness", description: "Build brand recognition and visibility" },
    { value: "educational", label: "Educational", description: "Share tips, tutorials, and insights" },
    { value: "behind_scenes", label: "Behind the Scenes", description: "Show company culture and processes" },
    { value: "user_generated", label: "User Generated", description: "Customer stories and testimonials" },
]

// Mock data for demo
const mockCompanies = [
    { id: "1", name: "TechCorp Solutions", description: "Leading software development company" },
    { id: "2", name: "Green Living Co", description: "Sustainable lifestyle products" },
]

const mockProducts = [
    { id: "1", title: "Smart Home Hub", price: 299.99 },
    { id: "2", title: "Eco-Friendly Water Bottle", price: 24.99 },
    { id: "3", title: "Wireless Headphones", price: 149.99 },
]

export default function GeneratePage() {
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([])
    const [selectedPost, setSelectedPost] = useState<GeneratedPost | null>(null)
    const [generationProgress, setGenerationProgress] = useState(0)

    const form = useForm<GenerateFormData>({
        resolver: zodResolver(generateSchema),
        defaultValues: {
            companyId: "",
            postCount: 5,
            platforms: [],
            contentTypes: [],
            productIds: [],
            additionalInstructions: "",
        },
    })

    const onSubmit = async (data: GenerateFormData) => {
        setIsGenerating(true)
        setGenerationProgress(0)

        try {
            // Simulate AI generation progress
            const progressSteps = [
                { progress: 20, message: "Analyzing brand profile..." },
                { progress: 40, message: "Generating content ideas..." },
                { progress: 60, message: "Creating post copy..." },
                { progress: 80, message: "Optimizing for platforms..." },
                { progress: 100, message: "Finalizing posts..." },
            ]

            for (const step of progressSteps) {
                await new Promise(resolve => setTimeout(resolve, 1000))
                setGenerationProgress(step.progress)
                toast.info(step.message)
            }

            // Mock generated posts
            const mockPosts: GeneratedPost[] = Array.from({ length: data.postCount }, (_, i) => ({
                id: `post-${i + 1}`,
                title: `Engaging Post ${i + 1}`,
                platform: data.platforms[i % data.platforms.length],
                format: "SQUARE",
                headline: `Amazing Product Discovery ${i + 1}`,
                subhead: "Transform your daily routine",
                caption: "🚀 Exciting news! We're revolutionizing the way you think about technology. Our latest innovation combines cutting-edge design with unmatched functionality. Ready to upgrade your experience? #Innovation #Technology #GameChanger",
                hashtags: ["#Innovation", "#Technology", "#ProductLaunch", "#Quality", "#GameChanger"],
                cta: "Shop Now and Save 20%",
                visualBrief: {
                    style: "modern",
                    colors: ["#3B82F6", "#10B981"],
                    imagery: "product"
                },
                altText: "Modern tech product showcased against a clean background with vibrant colors highlighting key features",
                exportUrls: [],
                createdAt: new Date().toISOString(),
            }))

            setGeneratedPosts(mockPosts)
            toast.success(`Successfully generated ${data.postCount} posts!`)

        } catch (error) {
            toast.error("Failed to generate posts. Please try again.")
        } finally {
            setIsGenerating(false)
            setGenerationProgress(0)
        }
    }

    const createDesign = async (post: GeneratedPost) => {
        try {
            toast.info("Creating design in Canva...")

            // Simulate design creation
            await new Promise(resolve => setTimeout(resolve, 2000))

            // Update post with design ID
            const updatedPosts = generatedPosts.map(p =>
                p.id === post.id
                    ? { ...p, designId: `design-${post.id}` }
                    : p
            )
            setGeneratedPosts(updatedPosts)

            toast.success("Design created successfully!")
        } catch (error) {
            toast.error("Failed to create design")
        }
    }

    const exportDesign = async (post: GeneratedPost) => {
        try {
            toast.info("Exporting design...")

            // Simulate export
            await new Promise(resolve => setTimeout(resolve, 2000))

            const mockExportUrl = "https://example.com/download/design.png"

            // Update post with export URL
            const updatedPosts = generatedPosts.map(p =>
                p.id === post.id
                    ? { ...p, exportUrls: [...p.exportUrls, mockExportUrl] }
                    : p
            )
            setGeneratedPosts(updatedPosts)

            toast.success("Design exported successfully!")
        } catch (error) {
            toast.error("Failed to export design")
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success("Copied to clipboard!")
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8 max-w-7xl">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center">
                            <Sparkles className="h-8 w-8 text-primary mr-2" />
                            AI Content Generator
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Generate engaging social media content powered by AI
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Generation Form */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-4">
                            <CardHeader>
                                <CardTitle>Content Settings</CardTitle>
                                <CardDescription>
                                    Configure your content generation preferences
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                                        {/* Company Selection */}
                                        <FormField
                                            control={form.control}
                                            name="companyId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Company</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select company" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {mockCompanies.map((company) => (
                                                                <SelectItem key={company.id} value={company.id}>
                                                                    {company.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Post Count */}
                                        <FormField
                                            control={form.control}
                                            name="postCount"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Number of Posts</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            max={20}
                                                            {...field}
                                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Generate 1-20 posts at once
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Platforms */}
                                        <FormField
                                            control={form.control}
                                            name="platforms"
                                            render={() => (
                                                <FormItem>
                                                    <FormLabel>Platforms</FormLabel>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {platformOptions.map((platform) => (
                                                            <FormField
                                                                key={platform.value}
                                                                control={form.control}
                                                                name="platforms"
                                                                render={({ field }) => {
                                                                    const PlatformIcon = platform.icon
                                                                    return (
                                                                        <FormItem key={platform.value}>
                                                                            <FormControl>
                                                                                <div className="flex items-center space-x-2">
                                                                                    <Checkbox
                                                                                        checked={field.value?.includes(platform.value)}
                                                                                        onCheckedChange={(checked) => {
                                                                                            return checked
                                                                                                ? field.onChange([...field.value, platform.value])
                                                                                                : field.onChange(
                                                                                                    field.value?.filter(
                                                                                                        (value) => value !== platform.value
                                                                                                    )
                                                                                                )
                                                                                        }}
                                                                                    />
                                                                                    <div className={`p-1 rounded ${platform.color}`}>
                                                                                        <PlatformIcon className="h-4 w-4 text-white" />
                                                                                    </div>
                                                                                    <FormLabel className="text-sm">
                                                                                        {platform.label}
                                                                                    </FormLabel>
                                                                                </div>
                                                                            </FormControl>
                                                                        </FormItem>
                                                                    )
                                                                }}
                                                            />
                                                        ))}
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Content Types */}
                                        <FormField
                                            control={form.control}
                                            name="contentTypes"
                                            render={() => (
                                                <FormItem>
                                                    <FormLabel>Content Types</FormLabel>
                                                    <div className="space-y-2">
                                                        {contentTypeOptions.map((type) => (
                                                            <FormField
                                                                key={type.value}
                                                                control={form.control}
                                                                name="contentTypes"
                                                                render={({ field }) => (
                                                                    <FormItem key={type.value}>
                                                                        <FormControl>
                                                                            <div className="flex items-start space-x-2">
                                                                                <Checkbox
                                                                                    checked={field.value?.includes(type.value)}
                                                                                    onCheckedChange={(checked) => {
                                                                                        return checked
                                                                                            ? field.onChange([...field.value, type.value])
                                                                                            : field.onChange(
                                                                                                field.value?.filter(
                                                                                                    (value) => value !== type.value
                                                                                                )
                                                                                            )
                                                                                    }}
                                                                                    className="mt-1"
                                                                                />
                                                                                <div>
                                                                                    <FormLabel className="text-sm font-medium">
                                                                                        {type.label}
                                                                                    </FormLabel>
                                                                                    <p className="text-xs text-muted-foreground">
                                                                                        {type.description}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                        </FormControl>
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        ))}
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Additional Instructions */}
                                        <FormField
                                            control={form.control}
                                            name="additionalInstructions"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Additional Instructions (Optional)</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Any specific requirements or themes for the content..."
                                                            className="min-h-[80px]"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <Button
                                            type="submit"
                                            className="w-full"
                                            disabled={isGenerating}
                                        >
                                            {isGenerating ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="h-4 w-4 mr-2" />
                                                    Generate Content
                                                </>
                                            )}
                                        </Button>

                                        {/* Progress */}
                                        {isGenerating && (
                                            <div className="space-y-2">
                                                <Progress value={generationProgress} />
                                                <p className="text-sm text-center text-muted-foreground">
                                                    {generationProgress}% complete
                                                </p>
                                            </div>
                                        )}
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Generated Posts */}
                    <div className="lg:col-span-2">
                        {generatedPosts.length === 0 ? (
                            <Card className="h-96 flex items-center justify-center">
                                <CardContent className="text-center">
                                    <Sparkles className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                                    <h3 className="text-lg font-semibold mb-2">Ready to Generate</h3>
                                    <p className="text-muted-foreground">
                                        Configure your settings and click "Generate Content" to create AI-powered social media posts
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold">Generated Posts ({generatedPosts.length})</h2>
                                    <Button variant="outline" size="sm" onClick={() => setGeneratedPosts([])}>
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Clear All
                                    </Button>
                                </div>

                                <div className="grid gap-4">
                                    {generatedPosts.map((post) => (
                                        <PostCard
                                            key={post.id}
                                            post={post}
                                            onCreateDesign={() => createDesign(post)}
                                            onExportDesign={() => exportDesign(post)}
                                            onPreview={() => setSelectedPost(post)}
                                            onCopyContent={() => copyToClipboard(post.caption)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Post Preview Dialog */}
                <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Post Preview</DialogTitle>
                            <DialogDescription>
                                Preview how your post will look on {selectedPost?.platform}
                            </DialogDescription>
                        </DialogHeader>
                        {selectedPost && <PostPreview post={selectedPost} />}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}

function PostCard({
    post,
    onCreateDesign,
    onExportDesign,
    onPreview,
    onCopyContent
}: {
    post: GeneratedPost
    onCreateDesign: () => void
    onExportDesign: () => void
    onPreview: () => void
    onCopyContent: () => void
}) {
    const platformOption = platformOptions.find(p => p.value === post.platform)
    const PlatformIcon = platformOption?.icon || Instagram

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className={`p-2 rounded-lg ${platformOption?.color || 'bg-gray-500'}`}>
                            <PlatformIcon className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold">{post.title}</h3>
                            <p className="text-sm text-muted-foreground">{post.platform} • {post.format}</p>
                        </div>
                    </div>
                    <div className="flex space-x-1">
                        <Button variant="ghost" size="sm" onClick={onPreview}>
                            <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={onCopyContent}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h4 className="font-medium mb-1">{post.headline}</h4>
                    {post.subhead && (
                        <p className="text-sm text-muted-foreground mb-2">{post.subhead}</p>
                    )}
                    <p className="text-sm line-clamp-3">{post.caption}</p>
                </div>

                <div className="flex flex-wrap gap-1">
                    {post.hashtags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                        </Badge>
                    ))}
                    {post.hashtags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                            +{post.hashtags.length - 3} more
                        </Badge>
                    )}
                </div>

                <div className="flex items-center space-x-2">
                    {!post.designId ? (
                        <Button size="sm" onClick={onCreateDesign}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Design
                        </Button>
                    ) : (
                        <>
                            <Button size="sm" variant="outline">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Edit in Canva
                            </Button>
                            <Button size="sm" onClick={onExportDesign}>
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </Button>
                        </>
                    )}
                    {post.designId && (
                        <Badge variant="outline" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Design Created
                        </Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

function PostPreview({ post }: { post: GeneratedPost }) {
    const platformOption = platformOptions.find(p => p.value === post.platform)
    const PlatformIcon = platformOption?.icon || Instagram

    return (
        <div className="space-y-4">
            <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-lg ${platformOption?.color || 'bg-gray-500'}`}>
                    <PlatformIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h3 className="font-semibold">{post.platform} Post</h3>
                    <p className="text-sm text-muted-foreground">{post.format} format</p>
                </div>
            </div>

            <Separator />

            <div className="space-y-3">
                <div>
                    <h4 className="font-semibold text-lg">{post.headline}</h4>
                    {post.subhead && (
                        <p className="text-muted-foreground">{post.subhead}</p>
                    )}
                </div>

                <div className="p-4 bg-muted rounded-lg">
                    <p className="whitespace-pre-wrap">{post.caption}</p>
                </div>

                <div>
                    <p className="text-sm font-medium mb-2">Hashtags:</p>
                    <div className="flex flex-wrap gap-1">
                        {post.hashtags.map((tag) => (
                            <Badge key={tag} variant="secondary">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                </div>

                <div>
                    <p className="text-sm font-medium mb-2">Call to Action:</p>
                    <p className="text-sm bg-primary/10 text-primary px-3 py-2 rounded">
                        {post.cta}
                    </p>
                </div>

                <div>
                    <p className="text-sm font-medium mb-2">Visual Brief:</p>
                    <div className="text-sm space-y-1">
                        <p><span className="font-medium">Style:</span> {post.visualBrief.style}</p>
                        <p><span className="font-medium">Colors:</span> {post.visualBrief.colors.join(", ")}</p>
                        <p><span className="font-medium">Imagery:</span> {post.visualBrief.imagery}</p>
                    </div>
                </div>

                <div>
                    <p className="text-sm font-medium mb-2">Alt Text:</p>
                    <p className="text-sm text-muted-foreground">{post.altText}</p>
                </div>
            </div>
        </div>
    )
}