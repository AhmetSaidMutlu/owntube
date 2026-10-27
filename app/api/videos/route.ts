import { NextResponse } from 'next/server'
import { and, asc, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { videos, subscriptions } from '@/lib/db/schema'

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(request.url)
  const type = url.searchParams.get('type') ?? 'videos'
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 100), 200)
  const offset = Math.max(Number(url.searchParams.get('offset') ?? 0), 0)
  const userId = session.user.id

  if (type === 'subscriptions') {
    const rows = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).orderBy(asc(subscriptions.channelTitle))
    return NextResponse.json({ subscriptions: rows })
  }

  const rows = await db.select().from(videos).where(eq(videos.userId, userId)).orderBy(desc(videos.publishedAt)).limit(limit).offset(offset)
  return NextResponse.json({ videos: rows })
}

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  if (!body.id) return NextResponse.json({ error: 'Video ID required' }, { status: 400 })
  await db.update(videos).set({ isWatched: true, watchedAt: new Date() }).where(and(eq(videos.id, body.id), eq(videos.userId, session.user.id)))
  return NextResponse.json({ success: true })
}
