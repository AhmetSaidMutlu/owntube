'use server'

import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export async function login(email: string, password: string) {
  try {
    const response = await auth.api.signInEmail({
      body: { email, password },
      headers: await headers(),
    })

    if (!response) return { error: 'Unable to sign in' }
    redirect('/dashboard')
  } catch {
    return { error: 'Invalid email or password' }
  }
}

export async function signup(email: string, password: string) {
  try {
    await auth.api.signUpEmail({
      body: { email, password, name: email.split('@')[0] || 'User' },
      headers: await headers(),
    })
    return { success: true }
  } catch {
    return { error: 'Unable to create account' }
  }
}

export async function logout() {
  await auth.api.signOut({ headers: await headers() })
  redirect('/auth/login')
}
