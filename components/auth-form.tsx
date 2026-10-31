"use client"

import Link from "next/link"
import { useActionState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SubmitButton } from "@/components/submit-button"
import { FormMessage } from "@/components/form-message"
import { login, register } from "@/app/actions/auth"

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [state, action] = useActionState(mode === "login" ? login : register, undefined)
  const isLogin = mode === "login"
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{isLogin ? "Welcome back" : "Create your account"}</CardTitle>
        <CardDescription>{isLogin ? "Log in to your content planner" : "Start planning content in minutes"}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" autoComplete="name" required />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete={isLogin ? "current-password" : "new-password"} required minLength={isLogin ? 1 : 8} />
          </div>
          <FormMessage state={state} />
          <SubmitButton className="w-full" size="lg" pendingText={isLogin ? "Logging in…" : "Creating account…"}>
            {isLogin ? "Log in" : "Create account"}
          </SubmitButton>
          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "No account yet? " : "Already have an account? "}
            <Link href={isLogin ? "/register" : "/login"} className="font-medium text-primary hover:underline">
              {isLogin ? "Sign up" : "Log in"}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
