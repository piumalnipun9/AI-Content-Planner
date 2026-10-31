"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, CalendarDays, LayoutDashboard, LayoutGrid, Settings, Sparkles, SquareStack } from "lucide-react"

const NAV = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/create", label: "Create", Icon: Sparkles },
  { href: "/posts", label: "Posts", Icon: SquareStack },
  { href: "/calendar", label: "Calendar", Icon: CalendarDays },
  { href: "/analytics", label: "Analytics", Icon: BarChart3 },
  { href: "/settings", label: "Settings", Icon: Settings },
  { href: "/brands", label: "All brands", Icon: LayoutGrid },
]

export function SidebarNav() {
  const pathname = usePathname()
  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col">
      {NAV.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
