import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { subscriptions } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/neon-auth'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { channelId, isActive } = await request.json()
  if (!channelId || typeof isActive !== 'boolean') return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  await db.update(subscriptions).set({ isActive }).where(and(eq(subscriptions.userId, user.id), eq(subscriptions.channelId, channelId)))
  return NextResponse.json({ success: true })
}
