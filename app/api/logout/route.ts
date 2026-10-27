import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function POST() {
  await auth.api.signOut({ headers: await headers() })
  return NextResponse.json({ success: true })
}

export async function GET(request: Request) {
  await auth.api.signOut({ headers: await headers() })
  return NextResponse.redirect(new URL('/auth/login', request.url))
}
