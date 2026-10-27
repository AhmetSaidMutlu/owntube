import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { subscriptions } from '@/lib/db/schema'

async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user
}

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await db.select().from(subscriptions).where(eq(subscriptions.userId, user.id))
  return NextResponse.json({ subscriptions: rows })
}

export async function PATCH(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { channelId, isActive } = await request.json()
  if (!channelId || typeof isActive !== 'boolean') return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  await db.update(subscriptions).set({ isActive }).where(and(eq(subscriptions.userId, user.id), eq(subscriptions.channelId, channelId)))
  return NextResponse.json({ success: true })
}
