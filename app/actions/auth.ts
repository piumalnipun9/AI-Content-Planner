"use server"

import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { createSession, deleteSession } from "@/lib/session"

export type FormState = { error?: string; ok?: string } | undefined

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
