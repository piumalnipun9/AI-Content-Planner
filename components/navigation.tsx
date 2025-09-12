"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    Home,
    MessageSquare,
    Calendar,
    BarChart3,
    Settings,
    User,
    LogOut,
    Menu,
    X,
    Sparkles,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const navigation = [
    {
        name: "Home",
        href: "/",
        icon: Home,
        description: "Overview and quick access",
    },
    {
        name: "Content Studio",
        href: "/studio",
        icon: MessageSquare,
        description: "AI-powered content creation",
        badge: "AI",
    },
    {
        name: "Content Planner",
        href: "/planner",
        icon: Calendar,
        description: "Visual scheduling calendar",
    },
    {
        name: "Analytics",
        href: "/analytics",
        icon: BarChart3,
        description: "Performance insights",
    },
    {
        name: "Settings",
        href: "/settings",
        icon: Settings,
        description: "Account and preferences",
    },
]

export function Navigation() {
    const pathname = usePathname()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const isActive = (href: string) => {
        if (href === "/") {
            return pathname === "/"
        }
        return pathname.startsWith(href)
    }

    return (
        <header className="fixed top-0 z-50 w-full border-b border-border bg-background shadow-sm">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex h-16 items-center justify-between">

                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center">
                            <Sparkles className="h-6 w-6 mr-2 text-primary" />
                            <span className="font-bold text-xl text-foreground">AI Social</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-8">
                        {navigation.map((item) => {
                            const active = isActive(item.href)

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`text-sm font-medium transition-colors duration-200 ${active
                                        ? "text-primary"
                                        : "text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    <span>{item.name}</span>
                                    {item.badge && (
                                        <Badge variant="secondary" className="ml-2 text-xs px-2 py-0.5 bg-primary/20 text-primary border-primary/30">
                                            {item.badge}
                                        </Badge>
                                    )}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Right Side */}
                    <div className="flex items-center gap-4">

                        {/* User Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg">
                                    Account
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 border border-border shadow-lg">
                                <DropdownMenuLabel className="font-semibold">My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="font-medium">
                                    <span>Profile</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="font-medium">
                                    <span>Settings</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="font-medium">
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Mobile Menu */}
                        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                            <SheetTrigger asChild className="md:hidden">
                                <Button variant="ghost" size="sm" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg">
                                    Menu
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-72 border-l border-border">
                                <div className="flex flex-col space-y-4 mt-4">

                                    {/* Mobile Navigation Links */}
                                    <nav className="space-y-2">
                                        {navigation.map((item) => {
                                            const active = isActive(item.href)

                                            return (
                                                <Link
                                                    key={item.name}
                                                    href={item.href}
                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                    className={`flex flex-col px-3 py-3 text-sm font-medium transition-colors ${active
                                                        ? "text-primary"
                                                        : "text-muted-foreground hover:text-primary"
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span>{item.name}</span>
                                                        {item.badge && (
                                                            <Badge variant="secondary" className="text-xs bg-primary/20 text-primary border-primary/30">
                                                                {item.badge}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1 text-left">
                                                        {item.description}
                                                    </p>
                                                </Link>
                                            )
                                        })}
                                    </nav>

                                    {/* Quick Actions */}
                                    <div className="pt-4 border-t border-border">
                                        <p className="text-sm font-medium mb-3 text-primary">Quick Actions</p>
                                        <div className="space-y-2">
                                            <Link
                                                href="/studio"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className="block px-3 py-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                                            >
                                                <Sparkles className="h-4 w-4 inline mr-2" />
                                                Start Creating
                                            </Link>
                                            <Link
                                                href="/settings"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className="block px-3 py-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                                            >
                                                Connect Accounts
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </header>
    )
}