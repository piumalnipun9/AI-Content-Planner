import Link from "next/link"
import { LogOut, Rocket } from "lucide-react"
import { requireBrand } from "@/lib/auth"
import { logout } from "@/app/actions/auth"
import { SidebarNav } from "@/components/sidebar-nav"
import { BrandSwitcher } from "@/components/brand-switcher"
import { PlatformIcon } from "@/components/platform-icon"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, brand, brands } = await requireBrand()

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col gap-4 border-b bg-card p-4 md:sticky md:top-0 md:h-screen md:w-64 md:border-r md:border-b-0">
        <Link href="/dashboard" className="flex items-center gap-2 px-2 text-lg font-semibold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Rocket className="size-4" />
          </span>
          Postpilot
        </Link>
        <BrandSwitcher
          activeId={brand.id}
          brands={brands.map((b) => ({ id: b.id, name: b.name, pageName: b.pageName, igUsername: b.igUsername, autopilot: b.autopilot }))}
        />
        <SidebarNav />
        <div className="mt-auto hidden space-y-3 md:block">
          <div className="rounded-lg border p-3 text-xs">
            <div className="space-y-1 text-muted-foreground">
              <p className="flex items-center gap-1.5">
                <PlatformIcon platform="FACEBOOK" className="size-3.5" />
                <span className="truncate">{brand.pageName ?? "No Page linked"}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <PlatformIcon platform="INSTAGRAM" className="size-3.5" />
                <span className="truncate">{brand.igUsername ? `@${brand.igUsername}` : "Not linked"}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <span className={`size-2 rounded-full ${brand.autopilot ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                Autopilot {brand.autopilot ? "on" : "off"}
              </p>
            </div>
          </div>
          <form action={logout} className="flex items-center justify-between px-1 text-xs text-muted-foreground">
            <span className="truncate">{user.email}</span>
            <button type="submit" className="rounded p-1 hover:bg-muted hover:text-foreground" title="Log out">
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  )
}
