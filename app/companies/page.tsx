"use client"

import { useState } from "react"
import Link from "next/link"
import {
    Building2,
    Plus,
    MoreHorizontal,
    Edit,
    Trash2,
    Package,
    BarChart3,
    Palette,
    ExternalLink,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Mock data for companies
const mockCompanies = [
    {
        id: "1",
        name: "TechCorp Solutions",
        description: "Leading software development company specializing in enterprise solutions and digital transformation.",
        tone: ["professional", "authoritative", "innovative"],
        brandKit: {
            primaryColor: "#3B82F6",
            secondaryColor: "#10B981",
            accentColor: "#F59E0B",
            logoUrl: "/logo-techcorp.png"
        },
        stats: {
            products: 12,
            posts: 45,
            templates: 8,
        },
        createdAt: "2024-01-10",
        lastActive: "2024-01-15",
    },
    {
        id: "2",
        name: "Green Living Co",
        description: "Sustainable lifestyle products for eco-conscious consumers.",
        tone: ["friendly", "inspirational", "casual"],
        brandKit: {
            primaryColor: "#059669",
            secondaryColor: "#84CC16",
            accentColor: "#F97316",
            logoUrl: "/logo-greenliving.png"
        },
        stats: {
            products: 28,
            posts: 78,
            templates: 12,
        },
        createdAt: "2024-01-05",
        lastActive: "2024-01-14",
    },
]

export default function CompaniesPage() {
    const [companies, setCompanies] = useState(mockCompanies)

    return (
        <div className="container mx-auto px-4 py-6">

            {/* Page Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center">
                        <Building2 className="h-8 w-8 text-primary mr-2" />
                        Companies
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your company profiles and brand settings
                    </p>
                </div>
                <Link href="/setup">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Company
                    </Button>
                </Link>
            </div>

            {/* Companies Grid */}
            {companies.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent>
                        <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-xl font-semibold mb-2">No Companies Yet</h3>
                        <p className="text-muted-foreground mb-6">
                            Create your first company profile to start generating AI-powered social media content.
                        </p>
                        <Link href="/setup">
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Create First Company
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {companies.map((company) => (
                        <CompanyCard key={company.id} company={company} />
                    ))}
                </div>
            )}
        </div>
    )
}

function CompanyCard({ company }: { company: any }) {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={company.brandKit.logoUrl} alt={company.name} />
                            <AvatarFallback style={{ backgroundColor: company.brandKit.primaryColor }}>
                                {company.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-lg">{company.name}</CardTitle>
                            <CardDescription className="line-clamp-2">
                                {company.description}
                            </CardDescription>
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">

                {/* Brand Tones */}
                <div>
                    <p className="text-sm font-medium mb-2">Brand Tones</p>
                    <div className="flex flex-wrap gap-1">
                        {company.tone.slice(0, 3).map((tone: string) => (
                            <Badge key={tone} variant="secondary" className="text-xs">
                                {tone}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Brand Colors */}
                <div>
                    <p className="text-sm font-medium mb-2">Brand Colors</p>
                    <div className="flex space-x-2">
                        <div
                            className="w-6 h-6 rounded border-2 border-white shadow-sm"
                            style={{ backgroundColor: company.brandKit.primaryColor }}
                            title="Primary"
                        />
                        <div
                            className="w-6 h-6 rounded border-2 border-white shadow-sm"
                            style={{ backgroundColor: company.brandKit.secondaryColor }}
                            title="Secondary"
                        />
                        <div
                            className="w-6 h-6 rounded border-2 border-white shadow-sm"
                            style={{ backgroundColor: company.brandKit.accentColor }}
                            title="Accent"
                        />
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 pt-2 border-t">
                    <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium">{company.stats.products}</p>
                        <p className="text-xs text-muted-foreground">Products</p>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium">{company.stats.posts}</p>
                        <p className="text-xs text-muted-foreground">Posts</p>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                            <Palette className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium">{company.stats.templates}</p>
                        <p className="text-xs text-muted-foreground">Templates</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                    <Link href="/generate" className="flex-1">
                        <Button size="sm" className="w-full">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Generate
                        </Button>
                    </Link>
                    <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}