import { NextResponse } from 'next/server'
import { eq, count } from 'drizzle-orm'
import { db } from '@/lib/db'
import { subscriptions, videos, youtubeAccounts } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/neon-auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ connected: false }, { status: 401 })
  const [account, videoCount, subscriptionCount] = await Promise.all([
    db.select({ id: youtubeAccounts.id }).from(youtubeAccounts).where(eq(youtubeAccounts.userId, user.id)).limit(1),
    db.select({ value: count() }).from(videos).where(eq(videos.userId, user.id)),
    db.select({ value: count() }).from(subscriptions).where(eq(subscriptions.userId, user.id)),
  ])
  return NextResponse.json({ connected: account.length > 0, video_count: Number(videoCount[0]?.value ?? 0), subscription_count: Number(subscriptionCount[0]?.value ?? 0) })
}
