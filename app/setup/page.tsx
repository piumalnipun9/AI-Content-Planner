"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
    Building2,
    Palette,
    Upload,
    Plus,
    X,
    CheckCircle,
    AlertCircle,
    Loader2,
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
import { apiClient } from "@/lib/api-client"

const companySchema = z.object({
    name: z.string().min(2, "Company name must be at least 2 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    tone: z.array(z.string()).min(1, "Select at least one brand tone"),
    brandKit: z.object({
        primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color"),
        secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color"),
        accentColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color"),
        logoUrl: z.string().url("Invalid logo URL").optional().or(z.literal("")),
        fonts: z.object({
            primary: z.string().min(1, "Primary font is required"),
            secondary: z.string().optional(),
        }),
    }),
})

type CompanyFormData = z.infer<typeof companySchema>

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

const fontOptions = [
    "Arial", "Helvetica", "Roboto", "Open Sans", "Lato", "Montserrat",
    "Playfair Display", "Merriweather", "Source Sans Pro", "Inter"
]

export default function CompanySetupPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [logoPreview, setLogoPreview] = useState<string>("")

    const form = useForm<CompanyFormData>({
        resolver: zodResolver(companySchema),
        defaultValues: {
            name: "",
            description: "",
            tone: [],
            brandKit: {
                primaryColor: "#3B82F6",
                secondaryColor: "#10B981",
                accentColor: "#F59E0B",
                logoUrl: "",
                fonts: {
                    primary: "Inter",
                    secondary: "",
                },
            },
        },
    })

    const totalSteps = 4
    const progress = (step / totalSteps) * 100

    const onSubmit = async (data: CompanyFormData) => {
        setIsSubmitting(true)

        try {
            // Upload logo if provided
            let logoUrl = data.brandKit.logoUrl
            if (logoFile) {
                try {
                    const uploadResult = await apiClient.uploadFile(logoFile, 'logos')
                    logoUrl = uploadResult.url
                } catch (uploadError) {
                    console.warn('Logo upload failed, proceeding without logo:', uploadError)
                }
            }

            // Create company with API
            const companyData = {
                ...data,
                brandKit: {
                    ...data.brandKit,
                    logoUrl: logoUrl || undefined,
                },
            }

            const result = await apiClient.createCompany(companyData)

            toast.success(`Company "${result.company.name}" created successfully!`)
            router.push("/")

        } catch (error: any) {
            console.error('Company creation error:', error)
            if (error.status === 401) {
                toast.error("Please log in to create a company profile.")
                router.push("/login")
            } else {
                toast.error(error.message || "Failed to create company profile. Please try again.")
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            setLogoFile(file)
            const reader = new FileReader()
            reader.onload = (e) => {
                const url = e.target?.result as string
                setLogoPreview(url)
                form.setValue("brandKit.logoUrl", url)
            }
            reader.readAsDataURL(file)
        }
    }

    const addTone = (tone: string) => {
        const currentTones = form.getValues("tone")
        if (!currentTones.includes(tone)) {
            form.setValue("tone", [...currentTones, tone])
        }
    }

    const removeTone = (tone: string) => {
        const currentTones = form.getValues("tone")
        form.setValue("tone", currentTones.filter(t => t !== tone))
    }

    const nextStep = () => setStep(Math.min(step + 1, totalSteps))
    const prevStep = () => setStep(Math.max(step - 1, 1))

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                        <Building2 className="h-8 w-8 text-primary mr-2" />
                        <h1 className="text-3xl font-bold">Company Setup</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Let's set up your company profile to create amazing social media content
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

                        {/* Step 1: Basic Information */}
                        {step === 1 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Building2 className="h-5 w-5 mr-2" />
                                        Basic Information
                                    </CardTitle>
                                    <CardDescription>
                                        Tell us about your company and what you do.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Company Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter your company name" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Company Description</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Describe what your company does, your mission, and key offerings..."
                                                        className="min-h-[120px]"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    This will help our AI understand your brand and create relevant content.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        )}

                        {/* Step 2: Brand Tone */}
                        {step === 2 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Brand Tone & Voice</CardTitle>
                                    <CardDescription>
                                        Select the tones that best represent your brand communication style.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {toneOptions.map((tone) => (
                                            <div
                                                key={tone.value}
                                                className={`p-4 rounded-lg border cursor-pointer transition-colors ${form.watch("tone").includes(tone.value)
                                                    ? "border-primary bg-primary/5"
                                                    : "border-border hover:border-primary/50"
                                                    }`}
                                                onClick={() => {
                                                    if (form.watch("tone").includes(tone.value)) {
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
                                                    {form.watch("tone").includes(tone.value) && (
                                                        <CheckCircle className="h-5 w-5 text-primary" />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {form.watch("tone").length > 0 && (
                                        <div className="mt-4">
                                            <p className="text-sm font-medium mb-2">Selected tones:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {form.watch("tone").map((tone) => (
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

                                    {form.formState.errors.tone && (
                                        <p className="text-sm text-destructive mt-2">
                                            {form.formState.errors.tone.message}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Step 3: Brand Colors & Logo */}
                        {step === 3 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Palette className="h-5 w-5 mr-2" />
                                        Brand Colors & Logo
                                    </CardTitle>
                                    <CardDescription>
                                        Define your visual identity with colors and logo.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">

                                    {/* Logo Upload */}
                                    <div className="space-y-2">
                                        <FormLabel>Logo (Optional)</FormLabel>
                                        <div className="flex items-center space-x-4">
                                            <div className="flex-1">
                                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50">
                                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                        <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                                                        <p className="text-sm text-muted-foreground">
                                                            Click to upload logo
                                                        </p>
                                                    </div>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={handleLogoUpload}
                                                    />
                                                </label>
                                            </div>
                                            {logoPreview && (
                                                <div className="w-32 h-32 border rounded-lg overflow-hidden">
                                                    <img
                                                        src={logoPreview}
                                                        alt="Logo preview"
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Colors */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="brandKit.primaryColor"
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
                                            name="brandKit.secondaryColor"
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
                                            name="brandKit.accentColor"
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
                                                style={{ backgroundColor: form.watch("brandKit.primaryColor") }}
                                            />
                                            <div
                                                className="w-16 h-16 rounded-lg border"
                                                style={{ backgroundColor: form.watch("brandKit.secondaryColor") }}
                                            />
                                            <div
                                                className="w-16 h-16 rounded-lg border"
                                                style={{ backgroundColor: form.watch("brandKit.accentColor") }}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Step 4: Typography */}
                        {step === 4 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Typography</CardTitle>
                                    <CardDescription>
                                        Choose fonts that represent your brand personality.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="brandKit.fonts.primary"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Primary Font</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select primary font" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {fontOptions.map((font) => (
                                                                <SelectItem key={font} value={font}>
                                                                    <span style={{ fontFamily: font }}>{font}</span>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="brandKit.fonts.secondary"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Secondary Font (Optional)</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select secondary font" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="">None</SelectItem>
                                                            {fontOptions.map((font) => (
                                                                <SelectItem key={font} value={font}>
                                                                    <span style={{ fontFamily: font }}>{font}</span>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Font Preview */}
                                    <div className="p-4 rounded-lg border bg-muted/50">
                                        <p className="text-sm font-medium mb-3">Typography Preview</p>
                                        <div className="space-y-2">
                                            <h2
                                                className="text-2xl font-bold"
                                                style={{ fontFamily: form.watch("brandKit.fonts.primary") }}
                                            >
                                                Your Company Name
                                            </h2>
                                            <p
                                                className="text-muted-foreground"
                                                style={{
                                                    fontFamily: form.watch("brandKit.fonts.secondary") || form.watch("brandKit.fonts.primary")
                                                }}
                                            >
                                                This is how your brand text will look in social media posts.
                                            </p>
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
                                                        Your brand profile is complete! You can now generate AI-powered social media content
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
                                                Creating...
                                            </>
                                        ) : (
                                            "Create Company Profile"
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