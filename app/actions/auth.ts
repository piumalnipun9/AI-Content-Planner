"use server"

import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"
import { z } from "zod"
import { db } from "@/lib/db"
import { createSession, deleteSession } from "@/lib/session"

export type FormState = { error?: string; ok?: string } | undefined

const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  email: z.email("Enter a valid email").transform((e) => e.toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(form))
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const { name, email, password } = parsed.data
  if (await db.user.findUnique({ where: { email } })) return { error: "An account with this email already exists" }
  const user = await db.user.create({ data: { name, email, passwordHash: await bcrypt.hash(password, 12) } })
  await createSession(user.id)
  redirect("/onboarding")
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").toLowerCase().trim()
  const password = String(form.get("password") ?? "")
  const user = await db.user.findUnique({ where: { email } })
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return { error: "Incorrect email or password" }
  await createSession(user.id)
  redirect("/dashboard")
}

export async function logout() {
  await deleteSession()
  redirect("/login")
}
