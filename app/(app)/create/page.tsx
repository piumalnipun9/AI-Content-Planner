import { Lightbulb } from "lucide-react"
import { requireBrand } from "@/lib/auth"
import { latestStrategy } from "@/lib/jobs"
import { localDate } from "@/lib/time"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { CampaignForm } from "@/components/campaign-form"

export const metadata = { title: "Create" }

export default async function CreatePage() {
  const { brand } = await requireBrand()
  const strategy = await latestStrategy(brand.id)
  const tomorrow = localDate(brand.timezone, 1)

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Create content" description="Describe a campaign and the AI writes the posts, designs the images and picks posting times." />
      {strategy && (
        <div className="mb-4 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <Lightbulb className="mt-0.5 size-4 shrink-0" />
          <span>
            Using your latest strategy from {strategy.createdAt.toLocaleDateString("en", { dateStyle: "medium" })}: {strategy.report.summary}
          </span>
        </div>
      )}
      <Card>
        <CardContent className="pt-6">
          <CampaignForm defaultStart={tomorrow} defaultCount={brand.postsPerWeek} instagramReady={Boolean(brand.pageId)} />
        </CardContent>
      </Card>
    </div>
  )
}
