import Link from "next/link"
import { redirect } from "next/navigation"
import { BarChart3, CalendarClock, Rocket, Send, Sparkles, Wand2 } from "lucide-react"
import { getUser } from "@/lib/auth"
import { buttonVariants } from "@/components/ui/button"

const STEPS = [
  { Icon: Wand2, title: "Describe your brand once", text: "Audience, tone, offers and visual style become the brief for everything the AI writes." },
  { Icon: Sparkles, title: "Generate a content plan", text: "Captions, hashtags and on-brand images for Facebook and Instagram, spread across your calendar." },
  { Icon: Send, title: "Publish automatically", text: "Approve, tweak or let autopilot schedule. Posts go out to your Page and Instagram on time." },
  { Icon: BarChart3, title: "Learn what works", text: "Reach and engagement flow back in. The AI strategist turns them into a better plan next week." },
]

export default async function Home() {
  if (await getUser()) redirect("/dashboard")
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between p-6">
        <span className="flex items-center gap-2 text-lg font-semibold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Rocket className="size-4" />
          </span>
          Postpilot
        </span>
        <nav className="flex gap-2">
          <Link href="/login" className={buttonVariants()}>Log in</Link>
        </nav>
      </header>
      <section className="mx-auto max-w-3xl px-6 pt-16 pb-20 text-center">
        <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
          <CalendarClock className="size-3.5" /> Facebook & Instagram on autopilot
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Your AI social media marketer</h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
          Plan, create and publish on-brand posts, then let real results shape the next week&apos;s strategy.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/login" className={buttonVariants({ size: "lg", className: "px-5" })}>Log in</Link>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ Icon, title, text }, i) => (
          <div key={title} className="rounded-xl border bg-card p-5">
            <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="size-4" /></span>
              Step {i + 1}
            </div>
            <h2 className="font-medium">{title}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
