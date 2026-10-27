import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { subscriptions, videos } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/neon-auth'
import { getSubscriptions, getVideosFromChannels } from '@/lib/youtube'
import { getYoutubeAccessToken } from '@/lib/youtube-token'

export async function POST() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const token = await getYoutubeAccessToken(user.id)
  if ('error' in token) return NextResponse.json({ error: token.error }, { status: token.status })
  const { accessToken } = token
  try {
    const channels = await getSubscriptions(accessToken)
    for (const channel of channels) {
      const existing = await db.select({ id: subscriptions.id }).from(subscriptions).where(and(eq(subscriptions.userId, user.id), eq(subscriptions.channelId, channel.id))).limit(1)
      const values = { userId: user.id, channelId: channel.id, channelTitle: channel.title, channelThumbnail: channel.thumbnail, isActive: true }
      if (existing[0]) await db.update(subscriptions).set(values).where(eq(subscriptions.id, existing[0].id))
      else await db.insert(subscriptions).values({ id: crypto.randomUUID(), ...values })
    }
    const active = await db.select({ channelId: subscriptions.channelId }).from(subscriptions).where(and(eq(subscriptions.userId, user.id), eq(subscriptions.isActive, true)))
    const channelIds = active.map(item => item.channelId)
    const fetched = channelIds.length ? await getVideosFromChannels(accessToken, channelIds) : []
    for (const video of fetched) {
      const existing = await db.select({ id: videos.id }).from(videos).where(and(eq(videos.userId, user.id), eq(videos.videoId, video.id))).limit(1)
      const values = { userId: user.id, videoId: video.id, title: video.title, description: video.description, thumbnailUrl: video.thumbnail, channelId: video.channelId, channelTitle: video.channelTitle, publishedAt: new Date(video.publishedAt), videoUrl: video.url }
      if (existing[0]) await db.update(videos).set(values).where(eq(videos.id, existing[0].id))
      else await db.insert(videos).values({ id: crypto.randomUUID(), ...values })
    }
    return NextResponse.json({ success: true, videos_synced: fetched.length, subscriptions_count: channels.length })
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Sync failed' }, { status: 500 }) }
}
