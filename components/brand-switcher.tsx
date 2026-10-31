"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRef, useTransition } from "react"
import { Check, ChevronsUpDown, LayoutGrid, Loader2, Plus } from "lucide-react"
import { switchBrand } from "@/app/actions/brand"

export interface BrandItem {
  id: string
  name: string
  pageName: string | null
  igUsername: string | null
  autopilot: boolean
}

export function BrandSwitcher({ brands, activeId }: { brands: BrandItem[]; activeId: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const menu = useRef<HTMLDetailsElement>(null)
  const active = brands.find((b) => b.id === activeId)!

  const choose = (id: string) => {
    menu.current?.removeAttribute("open")
    if (id === activeId) return
    start(async () => {
      await switchBrand(id)
      router.refresh()
    })
  }

  return (
    <details ref={menu} className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg border bg-background p-2 hover:bg-muted [&::-webkit-details-marker]:hidden">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-semibold text-primary">
          {active.name.slice(0, 1).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{active.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{active.pageName ?? "No Page linked"}</span>
        </span>
        {pending ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : <ChevronsUpDown className="size-4 text-muted-foreground" />}
      </summary>
      <div className="absolute inset-x-0 top-full z-50 mt-1 rounded-lg border bg-popover p-1 shadow-lg">
        <p className="px-2 py-1 text-xs text-muted-foreground">Brands</p>
        {brands.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => choose(b.id)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate">{b.name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {b.pageName ?? "No Page"}
                {b.autopilot ? " · autopilot" : ""}
              </span>
            </span>
            {b.id === activeId && <Check className="size-4 text-primary" />}
          </button>
        ))}
        <div className="my-1 border-t" />
        <Link href="/brands" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted" onClick={() => menu.current?.removeAttribute("open")}>
          <LayoutGrid className="size-4" /> All brands
        </Link>
        <Link href="/onboarding" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted" onClick={() => menu.current?.removeAttribute("open")}>
          <Plus className="size-4" /> Add brand
        </Link>
      </div>
    </details>
  )
}
