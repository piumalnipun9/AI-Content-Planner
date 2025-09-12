import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { Toaster } from "@/components/ui/sonner"
import { Navigation } from "@/components/navigation"
import "./globals.css"

export const metadata: Metadata = {
  title: "AI Social Media Scheduler",
  description: "Generate, design, and schedule AI-powered social media content with Canva integration",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="light">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <div className="min-h-screen bg-background">
          <Navigation />
          <main className="pt-16">
            <Suspense fallback={null}>{children}</Suspense>
          </main>
        </div>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
