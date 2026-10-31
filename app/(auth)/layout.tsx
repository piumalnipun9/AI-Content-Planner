import Link from "next/link"
import { redirect } from "next/navigation"
import { Rocket } from "lucide-react"
import { getUser } from "@/lib/auth"

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await getUser()) redirect("/dashboard")
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Rocket className="size-4" />
        </span>
        Postpilot
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
