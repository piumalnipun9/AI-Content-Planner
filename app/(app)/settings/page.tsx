import Link from "next/link"
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react"
import { requireBrand } from "@/lib/auth"
import { db } from "@/lib/db"
import { env } from "@/lib/env"
import { isWithinDays } from "@/lib/time"
import { META_SCOPES, redirectUri } from "@/lib/meta/oauth"
import { pageChoices } from "@/lib/page-choices"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { BrandForm } from "@/components/brand-form"
import { PlatformIcon } from "@/components/platform-icon"
import { AutopilotSwitch, BrandPageSelect, DeleteBrandButton, DisconnectButton } from "@/components/meta-controls"
import { AgentAccess } from "@/components/agent-access"

export const metadata = { title: "Settings" }

const META_MESSAGES: Record<string, { ok: boolean; text: string }> = {
  connected: { ok: true, text: "Facebook connected. Your brands' Pages are up to date." },
  new_pages: { ok: true, text: "Facebook connected. Some Pages don't have a brand yet: set one up below, or link one to this brand above." },
  no_pages: { ok: false, text: "Connected, but no Facebook Pages were shared. Reconnect and select your Page in the Facebook dialog." },
  denied: { ok: false, text: "Facebook connection was cancelled." },
  invalid_state: { ok: false, text: "The Facebook login expired or was tampered with. Please try again." },
  missing_app: { ok: false, text: "META_APP_ID and META_APP_SECRET are not set in .env." },
  error: { ok: false, text: "Facebook connection failed. Check the server logs and your Meta app settings." },
}

function Check({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      {ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-red-500" />}
      <span>{children}</span>
    </li>
  )
}

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ meta?: string }> }) {
  const { user, brand, brands } = await requireBrand()
  const [meta, tokens, pages] = await Promise.all([
    db.metaConnection.findUnique({ where: { userId: user.id } }),
    db.apiToken.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    pageChoices(user.id, brand.id),
  ])
  const message = META_MESSAGES[(await searchParams).meta ?? ""]
  const appUrl = env.appUrl()
  const publicUrl = !/localhost|127\.0\.0\.1|0\.0\.0\.0/.test(appUrl) && appUrl.startsWith("https://")
  const expiresSoon = isWithinDays(meta?.tokenExpiresAt, 7)
  const brandForPage = (pageId: string) => brands.find((b) => b.pageId === pageId)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Settings" description={`Brand settings apply to ${brand.name}. Account settings are shared by all your brands.`} />

      <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Brand: {brand.name}</h2>

      <Card>
        <CardHeader>
          <CardTitle>Facebook Page</CardTitle>
          <CardDescription>{brand.name} publishes to this Page and the Instagram Business/Creator account linked to it.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <PlatformIcon platform="FACEBOOK" className="size-6" />
              <div className="text-sm">
                <p className="font-medium">{brand.pageName ?? "No Page linked"}</p>
                <p className="text-muted-foreground">{brand.pageId && !brand.pageAccessToken ? "Reconnect Facebook to publish" : "Facebook Page"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <PlatformIcon platform="INSTAGRAM" className="size-6" />
              <div className="text-sm">
                <p className="font-medium">{brand.igUsername ? `@${brand.igUsername}` : "Not linked"}</p>
                <p className="text-muted-foreground">{brand.igUsername ? "Instagram account" : "Link an Instagram Business account to the Page in Meta Business Suite"}</p>
              </div>
            </div>
          </div>
          {pages.length > 0 ? (
            <div className={`space-y-1.5 ${brand.pageId ? "" : "rounded-lg border border-primary/40 bg-primary/5 p-3"}`}>
              <p className="text-sm font-medium">{brand.pageId ? "Linked Page" : `Choose the Page for ${brand.name}`}</p>
              <BrandPageSelect brandId={brand.id} pages={pages} current={brand.pageId} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Connect Facebook below to choose a Page.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-4">
            Autopilot
            <AutopilotSwitch brandId={brand.id} enabled={brand.autopilot} />
          </CardTitle>
          <CardDescription>
            When on, Postpilot checks hourly. If nothing is planned for {brand.name} in the coming week it writes and schedules {brand.postsPerWeek} posts
            using this brand&apos;s strategy, publishes them on time, collects results, and refreshes the strategy weekly. No approval step.
            Each brand&apos;s autopilot runs independently.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Brand profile</CardTitle>
          <CardDescription>The brief behind every caption, image and strategy for {brand.name}.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <BrandForm key={brand.id} brand={brand} zones={Intl.supportedValuesOf("timeZone")} />
          <div className="flex items-center justify-between gap-4 border-t pt-4 text-sm">
            <span className="text-muted-foreground">Delete this brand with all its posts, campaigns and analytics.</span>
            <DeleteBrandButton brandId={brand.id} name={brand.name} />
          </div>
        </CardContent>
      </Card>

      <h2 className="pt-4 text-sm font-semibold tracking-wide text-muted-foreground uppercase">Account</h2>

      <Card>
        <CardHeader>
          <CardTitle>Facebook connection</CardTitle>
          <CardDescription>One Facebook login gives Postpilot access to all the Pages you tick. Each brand then uses one of them.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <p className={`rounded-lg border p-3 text-sm ${message.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>{message.text}</p>
          )}
          {meta ? (
            <>
              {pages.length > 0 && (
                <ul className="divide-y rounded-lg border text-sm">
                  {pages.map((p) => {
                    const owner = brandForPage(p.id)
                    return (
                      <li key={p.id} className="flex items-center gap-3 p-2.5">
                        <PlatformIcon platform="FACEBOOK" className="size-4" />
                        <span className="min-w-0 flex-1">
                          <span className="font-medium">{p.name}</span>
                          <span className="text-muted-foreground">{p.igUsername ? ` · Instagram @${p.igUsername}` : " · no Instagram"}</span>
                        </span>
                        {owner ? (
                          <span className="text-xs text-muted-foreground">Brand: {owner.name}</span>
                        ) : (
                          <Link href={`/onboarding?page=${p.id}`} className={buttonVariants({ variant: "outline", size: "xs" })}>Set up brand</Link>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
              {expiresSoon && (
                <p className="flex items-center gap-2 text-sm text-amber-700"><AlertTriangle className="size-4" /> Your Facebook login expires soon. Reconnect to keep publishing.</p>
              )}
              <div className="flex gap-2">
                <a href="/api/meta/connect" className={buttonVariants({ variant: "outline", size: "sm" })}>Reconnect / add Pages</a>
                <DisconnectButton />
              </div>
            </>
          ) : (
            <a href="/api/meta/connect" className={buttonVariants({ size: "lg" })}>
              <PlatformIcon platform="FACEBOOK" /> Connect with Facebook
            </a>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agent access (MCP)</CardTitle>
          <CardDescription>
            Let AI agents such as Claude Code, Cursor or your own agents run Postpilot through the Model Context Protocol, across all your brands:
            plan content, edit, schedule, publish and read analytics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AgentAccess
            endpoint={`${appUrl}/api/mcp`}
            tokens={tokens.map((t) => ({ id: t.id, name: t.name, prefix: t.prefix, createdAt: t.createdAt.toISOString(), lastUsedAt: t.lastUsedAt?.toISOString() ?? null }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System status</CardTitle>
          <CardDescription>Configured in the server&apos;s .env file.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <ul className="space-y-2">
            <Check ok={env.hasGemini()}>Gemini API key {env.hasGemini() ? `(text: ${env.textModel()}, images: ${env.imageModel()})` : "missing: set GEMINI_API_KEY"}</Check>
            <Check ok={env.hasMeta()}>Meta app {env.hasMeta() ? "configured" : "missing: set META_APP_ID and META_APP_SECRET"}</Check>
            <Check ok={Boolean(env.metaConfigId())}>Facebook Login for Business configuration {env.metaConfigId() ? "set" : "missing: set META_CONFIG_ID (step 5 below)"}</Check>
            <Check ok={publicUrl}>
              Public HTTPS address: <code className="rounded bg-muted px-1">{appUrl}</code>
              {!publicUrl && " (Facebook and Instagram download images from this address, so publishing images needs a public HTTPS URL, e.g. an ngrok tunnel)"}
            </Check>
          </ul>
          <details className="rounded-lg border p-3" open={!env.hasMeta()}>
            <summary className="cursor-pointer font-medium">How to set up the Meta app</summary>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-muted-foreground">
              <li>
                Make sure your Instagram account is a <em>Business</em> or <em>Creator</em> account and is linked to your Facebook Page
                (Instagram app → Settings → Account type and tools, then Page settings → Linked accounts).
              </li>
              <li>Go to <a className="text-primary hover:underline" href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer">developers.facebook.com/apps</a>, log in with the Facebook account that manages the Page, and register as a developer if asked.</li>
              <li>Click <em>Create app</em>. Pick the use case for managing Pages / Facebook Login for Business (or <em>Other</em> → app type <em>Business</em>) and connect your business portfolio if asked.</li>
              <li>In the left menu open <em>Facebook Login for Business → Settings</em> (add the product first if it isn&apos;t there) and add this Valid OAuth Redirect URI: <code className="rounded bg-muted px-1">{redirectUri()}</code></li>
              <li>
                Open <em>Facebook Login for Business → Configurations → Create configuration</em>. Choose <em>User access token</em>, the longest expiry,
                assets <em>Pages</em> and <em>Instagram accounts</em>, and these permissions:
                <span className="mt-1 block font-mono text-xs">{META_SCOPES.join(", ")}</span>
                Copy the Configuration ID into <code>META_CONFIG_ID</code>.
              </li>
              <li>Open <em>App settings → Basic</em> and copy the App ID and App Secret into <code>META_APP_ID</code> and <code>META_APP_SECRET</code>. Restart the server.</li>
              <li>Click <em>Connect with Facebook</em> above and tick your Page and Instagram account in the dialog.</li>
              <li>While the app is in development mode it only works for people with a role on the app (you). To use it for other businesses, complete Business Verification and App Review for the permissions above.</li>
            </ol>
          </details>
        </CardContent>
      </Card>
    </div>
  )
}
