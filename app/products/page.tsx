"use client"

import { useState } from "react"
import {
    Package,
    Plus,
    Search,
    MoreHorizontal,
    Edit,
    Trash2,
    Eye,
    DollarSign,
    Tag,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

// Mock products data
const mockProducts = [
    {
        id: "1",
        sku: "TECH-001",
        title: "Smart Home Hub Pro",
        description: "Advanced smart home control center with AI integration and voice control capabilities.",
        price: 299.99,
        currency: "USD",
        images: ["/product1.jpg"],
        features: ["Voice Control", "AI Integration", "Mobile App", "Energy Monitoring"],
        categories: ["Smart Home", "Technology"],
        tags: ["bestseller", "new"],
        isActive: true,
        createdAt: "2024-01-10",
    },
    {
        id: "2",
        sku: "ECO-002",
        title: "Sustainable Water Bottle",
        description: "Eco-friendly water bottle made from recycled materials with temperature control.",
        price: 24.99,
        currency: "USD",
        images: ["/product2.jpg"],
        features: ["BPA-Free", "Temperature Control", "Leak-Proof", "Recyclable"],
        categories: ["Lifestyle", "Eco-Friendly"],
        tags: ["eco", "popular"],
        isActive: true,
        createdAt: "2024-01-08",
    },
    {
        id: "3",
        sku: "AUDIO-003",
        title: "Wireless Noise-Canceling Headphones",
        description: "Premium wireless headphones with active noise cancellation and 30-hour battery life.",
        price: 149.99,
        currency: "USD",
        images: ["/product3.jpg"],
        features: ["Noise Cancellation", "30h Battery", "Wireless", "Touch Controls"],
        categories: ["Audio", "Technology"],
        tags: ["premium", "bestseller"],
        isActive: true,
        createdAt: "2024-01-05",
    },
]

export default function ProductsPage() {
    const [products, setProducts] = useState(mockProducts)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("all")

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.sku.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === "all" || product.categories.includes(selectedCategory)
        return matchesSearch && matchesCategory
    })

    const categories = ["all", ...Array.from(new Set(products.flatMap(p => p.categories)))]

    return (
        <div className="container mx-auto px-4 py-6">

            {/* Page Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center">
                        <Package className="h-8 w-8 text-primary mr-2" />
                        Products
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your product catalog for AI content generation
                    </p>
                </div>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                </Button>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                                <Input
                                    placeholder="Search products by name or SKU..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="w-full sm:w-48">
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(category => (
                                    <SelectItem key={category} value={category}>
                                        {category === "all" ? "All Categories" : category}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent>
                        <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-xl font-semibold mb-2">No Products Found</h3>
                        <p className="text-muted-foreground mb-6">
                            {searchQuery || selectedCategory !== "all"
                                ? "Try adjusting your search or filter criteria."
                                : "Add your first product to start generating AI content."}
                        </p>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Product
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    )
}

function ProductCard({ product }: { product: any }) {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                            <CardTitle className="text-lg line-clamp-1">{product.title}</CardTitle>
                            {product.tags.includes("bestseller") && (
                                <Badge variant="default" className="text-xs">Bestseller</Badge>
                            )}
                        </div>
                        <CardDescription className="line-clamp-2 mb-2">
                            {product.description}
                        </CardDescription>
                        <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
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

                {/* Price */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-lg font-semibold">
                            {product.price.toLocaleString('en-US', {
                                style: 'currency',
                                currency: product.currency
                            })}
                        </span>
                    </div>
                    <Badge variant={product.isActive ? "default" : "secondary"}>
                        {product.isActive ? "Active" : "Inactive"}
                    </Badge>
                </div>

                {/* Categories */}
                <div>
                    <p className="text-sm font-medium mb-2">Categories</p>
                    <div className="flex flex-wrap gap-1">
                        {product.categories.map((category: string) => (
                            <Badge key={category} variant="outline" className="text-xs">
                                {category}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Features */}
                <div>
                    <p className="text-sm font-medium mb-2">Key Features</p>
                    <div className="text-xs text-muted-foreground">
                        {product.features.slice(0, 2).join(" • ")}
                        {product.features.length > 2 && ` +${product.features.length - 2} more`}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                    <Button size="sm" className="flex-1">
                        Generate Content
                    </Button>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>{product.title}</DialogTitle>
                                <DialogDescription>Product Details</DialogDescription>
                            </DialogHeader>
                            <ProductDetails product={product} />
                        </DialogContent>
                    </Dialog>
                </div>
            </CardContent>
        </Card>
    )
}

function ProductDetails({ product }: { product: any }) {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-sm text-muted-foreground">{product.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <h3 className="font-semibold mb-2">SKU</h3>
                    <p className="text-sm">{product.sku}</p>
                </div>
                <div>
                    <h3 className="font-semibold mb-2">Price</h3>
                    <p className="text-sm font-medium">
                        {product.price.toLocaleString('en-US', {
                            style: 'currency',
                            currency: product.currency
                        })}
                    </p>
                </div>
            </div>

            <div>
                <h3 className="font-semibold mb-2">Features</h3>
                <div className="grid grid-cols-2 gap-2">
                    {product.features.map((feature: string, index: number) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                            <span>{feature}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="font-semibold mb-2">Categories & Tags</h3>
                <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                        {product.categories.map((category: string) => (
                            <Badge key={category} variant="outline">
                                {category}
                            </Badge>
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {product.tags.map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                                <Tag className="h-3 w-3 mr-1" />
                                {tag}
                            </Badge>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}