"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
    User,
    Palette,
    Settings,
    CheckCircle,
    AlertCircle,
    Loader2,
    Key,
    Sparkles,
    X,
    Upload,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

const userSetupSchema = z.object({
    preferences: z.object({
        brandTone: z.array(z.string()).min(1, "Select at least one brand tone"),
        primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color"),
        secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color"),
        accentColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color"),
        defaultPlatforms: z.array(z.string()).min(1, "Select at least one platform"),
    }),
    apiKeys: z.object({
        geminiKey: z.string().optional(),
    }),
})

type UserSetupData = z.infer<typeof userSetupSchema>

const toneOptions = [
    { value: "professional", label: "Professional", description: "Formal and business-focused" },
    { value: "casual", label: "Casual", description: "Relaxed and approachable" },
    { value: "friendly", label: "Friendly", description: "Warm and welcoming" },
    { value: "playful", label: "Playful", description: "Fun and creative" },
    { value: "authoritative", label: "Authoritative", description: "Expert and trustworthy" },
    { value: "inspirational", label: "Inspirational", description: "Motivating and uplifting" },
    { value: "humorous", label: "Humorous", description: "Light-hearted and funny" },
    { value: "luxury", label: "Luxury", description: "Premium and sophisticated" },
]

const platformOptions = [
    { value: "INSTAGRAM", label: "Instagram", description: "Share photos and stories" },
    { value: "FACEBOOK", label: "Facebook", description: "Connect with your community" },
    { value: "TWITTER", label: "Twitter", description: "Share quick updates" },
    { value: "LINKEDIN", label: "LinkedIn", description: "Professional networking" },
    { value: "TIKTOK", label: "TikTok", description: "Short-form video content" },
]

export default function UserSetupPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [logoPreview, setLogoPreview] = useState<string | null>(null)

    const form = useForm<UserSetupData>({
        resolver: zodResolver(userSetupSchema),
        defaultValues: {
            preferences: {
                brandTone: [],
                primaryColor: "#1877F2",
                secondaryColor: "#42A5F5",
                accentColor: "#FF6B6B",
                defaultPlatforms: [],
            },
            apiKeys: {
                geminiKey: "",
            },
        },
    })

    const totalSteps = 3
    const progress = (step / totalSteps) * 100

    const onSubmit = async (data: UserSetupData) => {
        setIsSubmitting(true)

        try {
            // Save user preferences to localStorage for now
            // In a full implementation, this would be saved to the database
            localStorage.setItem('userPreferences', JSON.stringify(data.preferences))

            // Save API keys if provided
            const apiKeyPromises = []

            if (data.apiKeys.geminiKey) {
                apiKeyPromises.push(
                    fetch('/api/user/api-keys', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            provider: 'GEMINI',
                            keyName: 'Gemini API Key',
                            keyValue: data.apiKeys.geminiKey,
                        }),
                    })
                )
            }

            await Promise.all(apiKeyPromises)

            toast.success("Profile setup completed successfully!")
            router.push("/")

        } catch (error: any) {
            console.error('Profile setup error:', error)
            toast.error("Failed to complete profile setup. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const addTone = (tone: string) => {
        const currentTones = form.getValues("preferences.brandTone")
        if (!currentTones.includes(tone)) {
            form.setValue("preferences.brandTone", [...currentTones, tone])
        }
    }

    const removeTone = (tone: string) => {
        const currentTones = form.getValues("preferences.brandTone")
        form.setValue("preferences.brandTone", currentTones.filter(t => t !== tone))
    }

    const addPlatform = (platform: string) => {
        const currentPlatforms = form.getValues("preferences.defaultPlatforms")
        if (!currentPlatforms.includes(platform)) {
            form.setValue("preferences.defaultPlatforms", [...currentPlatforms, platform])
        }
    }

    const removePlatform = (platform: string) => {
        const currentPlatforms = form.getValues("preferences.defaultPlatforms")
        form.setValue("preferences.defaultPlatforms", currentPlatforms.filter(p => p !== platform))
    }

    const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
                setLogoPreview(e.target?.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const nextStep = () => setStep(Math.min(step + 1, totalSteps))
    const prevStep = () => setStep(Math.max(step - 1, 1))

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                        <User className="h-8 w-8 text-primary mr-2" />
                        <h1 className="text-3xl font-bold">Profile Setup</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Customize your AI content generation preferences
                    </p>
                </div>

                {/* Progress */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Step {step} of {totalSteps}</span>
                        <span className="text-sm text-muted-foreground">{Math.round(progress)}% complete</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                        {/* Step 1: Brand Preferences */}
                        {step === 1 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Palette className="h-5 w-5 mr-2" />
                                        Brand Preferences
                                    </CardTitle>
                                    <CardDescription>
                                        Set your brand tone and default platforms for content generation.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Brand Tone */}
                                    <div className="space-y-4">
                                        <FormLabel>Brand Tone & Voice</FormLabel>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {toneOptions.map((tone) => (
                                                <div
                                                    key={tone.value}
                                                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${form.watch("preferences.brandTone").includes(tone.value)
                                                        ? "border-primary bg-primary/5"
                                                        : "border-border hover:border-primary/50"
                                                        }`}
                                                    onClick={() => {
                                                        if (form.watch("preferences.brandTone").includes(tone.value)) {
                                                            removeTone(tone.value)
                                                        } else {
                                                            addTone(tone.value)
                                                        }
                                                    }}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <h3 className="font-medium">{tone.label}</h3>
                                                            <p className="text-sm text-muted-foreground mt-1">
                                                                {tone.description}
                                                            </p>
                                                        </div>
                                                        {form.watch("preferences.brandTone").includes(tone.value) && (
                                                            <CheckCircle className="h-5 w-5 text-primary" />
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {form.watch("preferences.brandTone").length > 0 && (
                                            <div className="mt-4">
                                                <p className="text-sm font-medium mb-2">Selected tones:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {form.watch("preferences.brandTone").map((tone) => (
                                                        <Badge key={tone} variant="secondary" className="flex items-center gap-1">
                                                            {toneOptions.find(t => t.value === tone)?.label}
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-auto p-0 ml-1"
                                                                onClick={() => removeTone(tone)}
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </Button>
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <Separator />

                                    {/* Default Platforms */}
                                    <div className="space-y-4">
                                        <FormLabel>Default Platforms</FormLabel>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {platformOptions.map((platform) => (
                                                <div
                                                    key={platform.value}
                                                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${form.watch("preferences.defaultPlatforms").includes(platform.value)
                                                        ? "border-primary bg-primary/5"
                                                        : "border-border hover:border-primary/50"
                                                        }`}
                                                    onClick={() => {
                                                        if (form.watch("preferences.defaultPlatforms").includes(platform.value)) {
                                                            removePlatform(platform.value)
                                                        } else {
                                                            addPlatform(platform.value)
                                                        }
                                                    }}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <h3 className="font-medium">{platform.label}</h3>
                                                            <p className="text-sm text-muted-foreground mt-1">
                                                                {platform.description}
                                                            </p>
                                                        </div>
                                                        {form.watch("preferences.defaultPlatforms").includes(platform.value) && (
                                                            <CheckCircle className="h-5 w-5 text-primary" />
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Step 2: Brand Colors */}
                        {step === 2 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Palette className="h-5 w-5 mr-2" />
                                        Brand Colors
                                    </CardTitle>
                                    <CardDescription>
                                        Define your visual identity with brand colors.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Colors */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="preferences.primaryColor"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Primary Color</FormLabel>
                                                    <FormControl>
                                                        <div className="flex items-center space-x-2">
                                                            <Input
                                                                type="color"
                                                                className="w-16 h-10 p-1 rounded border"
                                                                {...field}
                                                            />
                                                            <Input
                                                                placeholder="#3B82F6"
                                                                className="flex-1"
                                                                {...field}
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="preferences.secondaryColor"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Secondary Color</FormLabel>
                                                    <FormControl>
                                                        <div className="flex items-center space-x-2">
                                                            <Input
                                                                type="color"
                                                                className="w-16 h-10 p-1 rounded border"
                                                                {...field}
                                                            />
                                                            <Input
                                                                placeholder="#10B981"
                                                                className="flex-1"
                                                                {...field}
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="preferences.accentColor"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Accent Color</FormLabel>
                                                    <FormControl>
                                                        <div className="flex items-center space-x-2">
                                                            <Input
                                                                type="color"
                                                                className="w-16 h-10 p-1 rounded border"
                                                                {...field}
                                                            />
                                                            <Input
                                                                placeholder="#F59E0B"
                                                                className="flex-1"
                                                                {...field}
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Color Preview */}
                                    <div className="p-4 rounded-lg border bg-muted/50">
                                        <p className="text-sm font-medium mb-3">Color Preview</p>
                                        <div className="flex space-x-2">
                                            <div
                                                className="w-16 h-16 rounded-lg border"
                                                style={{ backgroundColor: form.watch("preferences.primaryColor") }}
                                            />
                                            <div
                                                className="w-16 h-16 rounded-lg border"
                                                style={{ backgroundColor: form.watch("preferences.secondaryColor") }}
                                            />
                                            <div
                                                className="w-16 h-16 rounded-lg border"
                                                style={{ backgroundColor: form.watch("preferences.accentColor") }}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Step 3: API Keys */}
                        {step === 3 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Key className="h-5 w-5 mr-2" />
                                        API Keys (Optional)
                                    </CardTitle>
                                    <CardDescription>
                                        Add your API keys to enable AI content generation. You can add these later in settings.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="apiKeys.geminiKey"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Google Gemini API Key</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="password"
                                                        placeholder="AI..."
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Required for AI-powered content generation
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="p-4 rounded-lg border bg-blue-50 dark:bg-blue-950/20">
                                        <div className="flex items-start space-x-3">
                                            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                                            <div>
                                                <h3 className="font-medium text-blue-900 dark:text-blue-100">Security Note</h3>
                                                <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                                                    Your API keys are encrypted and stored securely. They are only used for content generation and never shared.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Summary */}
                                    <Card className="bg-primary/5 border-primary/20">
                                        <CardContent className="p-4">
                                            <div className="flex items-start space-x-3">
                                                <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                                                <div>
                                                    <h3 className="font-medium text-primary">Ready to Create</h3>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        Your profile setup is complete! You can now generate AI-powered social media content
                                                        that matches your brand identity.
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </CardContent>
                            </Card>
                        )}

                        {/* Navigation */}
                        <div className="flex justify-between pt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={prevStep}
                                disabled={step === 1}
                            >
                                Previous
                            </Button>

                            <div className="flex space-x-2">
                                {step < totalSteps ? (
                                    <Button type="button" onClick={nextStep}>
                                        Next Step
                                    </Button>
                                ) : (
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Setting up...
                                            </>
                                        ) : (
                                            "Complete Setup"
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    )
}