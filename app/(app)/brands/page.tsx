import Link from "next/link"
import { AlertTriangle, Plus } from "lucide-react"
import { requireBrand } from "@/lib/auth"
import { brandOverview } from "@/lib/services/brands"
import { pageChoices } from "@/lib/page-choices"
import { formatInZone } from "@/lib/time"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { PlatformIcon } from "@/components/platform-icon"
import { fmtNumber } from "@/components/charts"
import { OpenBrand } from "@/components/open-brand"
import { AutopilotSwitch } from "@/components/meta-controls"

export const metadata = { title: "All brands" }

export default async function BrandsPage() {
  const { user, brand: active } = await requireBrand()
  const [overview, pages] = await Promise.all([brandOverview(user.id), pageChoices(user.id)])
  const unclaimed = pages.filter((p) => !p.usedBy)

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="All brands" description="Every brand runs on its own: own Page, profile, schedule, analytics, strategy and autopilot.">
        <Link href="/onboarding" className={buttonVariants()}>
          <Plus /> Add brand
        </Link>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {overview.map(({ brand, scheduledThisWeek, publishedThisMonth, reach, failed, next }) => (
          <Card key={brand.id} className={brand.id === active.id ? "ring-2 ring-primary/40" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span className="truncate">{brand.name}</span>
                <span className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
                  Autopilot <AutopilotSwitch brandId={brand.id} enabled={brand.autopilot} />
                </span>
              </CardTitle>
              <CardDescription className="space-y-0.5">
                <span className="flex items-center gap-1.5">
                  <PlatformIcon platform="FACEBOOK" className="size-3.5" /> {brand.pageName ?? "No Page linked"}
                </span>
                <span className="flex items-center gap-1.5">
                  <PlatformIcon platform="INSTAGRAM" className="size-3.5" /> {brand.igUsername ? `@${brand.igUsername}` : "No Instagram"}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <dl className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-muted/50 p-2">
                  <dt className="text-xs text-muted-foreground">Next 7 days</dt>
                  <dd className="text-lg font-semibold">{scheduledThisWeek}</dd>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <dt className="text-xs text-muted-foreground">Published 30d</dt>
                  <dd className="text-lg font-semibold">{publishedThisMonth}</dd>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <dt className="text-xs text-muted-foreground">Reach 30d</dt>
                  <dd className="text-lg font-semibold">{fmtNumber(reach)}</dd>
                </div>
              </dl>
              <p className="text-xs text-muted-foreground">
                {next?.scheduledAt ? `Next post ${formatInZone(next.scheduledAt, brand.timezone)}` : "Nothing scheduled"}
              </p>
              {failed > 0 && (
                <p className="flex items-center gap-1.5 text-xs text-red-700">
                  <AlertTriangle className="size-3.5" /> {failed} failed post{failed > 1 ? "s" : ""}
                </p>
              )}
              {!brand.pageId && <p className="text-xs text-amber-700">Link a Facebook Page in this brand&apos;s Settings to publish.</p>}
              <div className="flex flex-wrap gap-2 pt-1">
                <OpenBrand brandId={brand.id} href="/dashboard">Open</OpenBrand>
                <OpenBrand brandId={brand.id} href="/create" variant="outline">Create content</OpenBrand>
                <OpenBrand brandId={brand.id} href="/settings" variant="outline">Settings</OpenBrand>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {unclaimed.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-1 font-medium">Connected Pages without a brand</h2>
          <p className="mb-3 text-sm text-muted-foreground">Give each Page its own brand profile so its posts match its audience and voice.</p>
          <ul className="divide-y rounded-xl border bg-card">
            {unclaimed.map((p) => (
              <li key={p.id} className="flex items-center gap-3 p-3">
                <PlatformIcon platform="FACEBOOK" className="size-5" />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{p.name}</span>
                  <span className="text-xs text-muted-foreground">{p.igUsername ? `Instagram @${p.igUsername}` : "No Instagram linked"}</span>
                </span>
                <Link href={`/onboarding?page=${p.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Set up brand
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
