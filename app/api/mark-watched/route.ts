import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { videos } from '@/lib/db/schema'

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { videoId, watchedPercentage } = await request.json()
  if (!videoId) return NextResponse.json({ error: 'Video ID required' }, { status: 400 })
  if (Number(watchedPercentage) < 30) return NextResponse.json({ success: true, marked_watched: false })
  await db.update(videos).set({ isWatched: true, watchedAt: new Date() }).where(and(eq(videos.id, videoId), eq(videos.userId, session.user.id)))
  return NextResponse.json({ success: true, marked_watched: true })
}
