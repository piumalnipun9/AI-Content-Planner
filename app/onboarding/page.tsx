import Link from "next/link"
import { ArrowLeft, Rocket } from "lucide-react"
import { requireUser, getBrands } from "@/lib/auth"
import { pageChoices } from "@/lib/page-choices"
import { BrandForm } from "@/components/brand-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = { title: "Add a brand" }

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await requireUser()
  const [brands, pages, { page }] = await Promise.all([getBrands(user.id), pageChoices(user.id), searchParams])
  const first = brands.length === 0
  const preselected = pages.find((p) => p.id === page && !p.usedBy)

  return (
    <div className="mx-auto max-w-3xl p-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <span className="flex items-center gap-2 text-lg font-semibold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Rocket className="size-4" />
          </span>
          Postpilot
        </span>
        {!first && (
          <Link href="/brands" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> All brands
          </Link>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {first ? `Tell us about your brand, ${user.name.split(" ")[0]}` : preselected ? `Set up a brand for ${preselected.name}` : "Add a brand"}
          </CardTitle>
          <CardDescription>
            Each brand has its own profile, Facebook Page, content, analytics and strategy. This is the brief the AI uses for every post.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BrandForm
            zones={Intl.supportedValuesOf("timeZone")}
            pages={pages.length ? pages : undefined}
            defaultPageId={preselected?.id}
            submitLabel={first ? "Continue to dashboard" : "Create brand"}
          />
        </CardContent>
      </Card>
    </div>
  )
}
