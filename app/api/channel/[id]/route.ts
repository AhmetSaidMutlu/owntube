import { NextResponse } from 'next/server'
import { and, asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { subscriptions, videos } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/neon-auth'
import { unsubscribeFromChannel, YouTubeApiError } from '@/lib/youtube'
import { getYoutubeAccessToken } from '@/lib/youtube-token'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const [subscription, channelVideos] = await Promise.all([
    db.select({ channelTitle: subscriptions.channelTitle, channelThumbnail: subscriptions.channelThumbnail }).from(subscriptions).where(and(eq(subscriptions.userId, user.id), eq(subscriptions.channelId, id))).limit(1),
    db.select().from(videos).where(and(eq(videos.userId, user.id), eq(videos.channelId, id))).orderBy(asc(videos.publishedAt)),
  ])
  return NextResponse.json({ subscription: subscription[0] ?? null, videos: channelVideos })
}

const SCOPE_ERRORS = ['insufficientPermissions', 'ACCESS_TOKEN_SCOPE_INSUFFICIENT']

// Kanalı takipten çıkar: önce YouTube'dan, başarılı olursa kanala ait videoları ve aboneliği DB'den sil.
// YouTube adımı başarısız olursa DB'ye dokunulmaz; aksi halde bir sonraki sync kanalı geri getirir.
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const token = await getYoutubeAccessToken(user.id)
  if ('error' in token) return NextResponse.json({ error: token.error, code: 'reauth_required' }, { status: token.status })

  let youtubeUnsubscribed: boolean
  try {
    youtubeUnsubscribed = await unsubscribeFromChannel(token.accessToken, id)
  } catch (error) {
    if (error instanceof YouTubeApiError && (error.status === 401 || SCOPE_ERRORS.includes(error.reason ?? ''))) {
      return NextResponse.json({ error: 'YouTube permission missing', code: 'reauth_required' }, { status: 403 })
    }
    if (error instanceof YouTubeApiError && error.reason === 'quotaExceeded') {
      return NextResponse.json({ error: 'YouTube quota exceeded', code: 'quota_exceeded' }, { status: 429 })
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unsubscribe failed' }, { status: 502 })
  }

  const deleted = await db.transaction(async tx => {
    const removed = await tx.delete(videos).where(and(eq(videos.userId, user.id), eq(videos.channelId, id))).returning({ id: videos.id })
    await tx.delete(subscriptions).where(and(eq(subscriptions.userId, user.id), eq(subscriptions.channelId, id)))
    return removed.length
  })

  return NextResponse.json({ success: true, videos_deleted: deleted, youtube_unsubscribed: youtubeUnsubscribed })
}
