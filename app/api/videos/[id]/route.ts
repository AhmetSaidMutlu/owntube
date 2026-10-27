import { NextResponse } from 'next/server'
import { and, desc, eq, ne } from 'drizzle-orm'
import { db } from '@/lib/db'
import { subscriptions, videos } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/neon-auth'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const current = (await db.select().from(videos).where(and(eq(videos.userId, user.id), eq(videos.videoId, id))).limit(1))[0]
  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const pool = await db.select().from(videos).where(and(eq(videos.userId, user.id), ne(videos.videoId, id))).orderBy(desc(videos.publishedAt)).limit(200)
  const subs = await db.select({ channelId: subscriptions.channelId, channelThumbnail: subscriptions.channelThumbnail }).from(subscriptions).where(eq(subscriptions.userId, user.id))
  const thumbs = new Map(subs.map(item => [item.channelId, item.channelThumbnail]))
  return NextResponse.json({ video: current, related: pool.map(item => ({ ...item, channelThumbnail: thumbs.get(item.channelId || '') })) })
}
