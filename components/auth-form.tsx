"use client"

import { useActionState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SubmitButton } from "@/components/submit-button"
import { FormMessage } from "@/components/form-message"
import { login } from "@/app/actions/auth"

export function AuthForm() {
  const [state, action] = useActionState(login, undefined)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>Log in to your content planner</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          <FormMessage state={state} />
          <SubmitButton className="w-full" size="lg" pendingText="Logging in…">
            Log in
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  )
}
