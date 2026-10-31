"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { switchBrand } from "@/app/actions/brand"

/** Switch the active brand, then go to one of its pages. */
export function OpenBrand({ brandId, href, children, variant = "default" }: { brandId: string; href: string; children: React.ReactNode; variant?: "default" | "outline" }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <Button
      variant={variant}
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await switchBrand(brandId)
          router.push(href)
        })
      }
    >
      {pending && <Loader2 className="animate-spin" />}
      {children}
    </Button>
  )
}
