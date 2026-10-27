import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { youtubeAccounts } from '@/lib/db/schema'

async function refreshAccessToken(refreshToken: string) {
  const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID || '', client_secret: process.env.YOUTUBE_CLIENT_SECRET || '', refresh_token: refreshToken, grant_type: 'refresh_token' }) })
  if (!response.ok) return null
  const data = await response.json()
  return data.access_token as string | null
}

export type YoutubeTokenResult =
  | { accessToken: string }
  | { error: 'No YouTube connection' | 'YouTube token expired'; status: 400 | 401 }

// Kullanıcının geçerli YouTube erişim token'ını döner; süresi dolmuşsa yeniler ve kaydeder.
export async function getYoutubeAccessToken(userId: string): Promise<YoutubeTokenResult> {
  const account = (await db.select().from(youtubeAccounts).where(eq(youtubeAccounts.userId, userId)).limit(1))[0]
  if (!account?.accessToken) return { error: 'No YouTube connection', status: 400 }
  if (account.expiresAt && account.expiresAt > new Date()) return { accessToken: account.accessToken }
  if (!account.refreshToken) return { error: 'YouTube token expired', status: 401 }
  const refreshed = await refreshAccessToken(account.refreshToken)
  if (!refreshed) return { error: 'YouTube token expired', status: 401 }
  await db.update(youtubeAccounts).set({ accessToken: refreshed, expiresAt: new Date(Date.now() + 3600000) }).where(eq(youtubeAccounts.id, account.id))
  return { accessToken: refreshed }
}
