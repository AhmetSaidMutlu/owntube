import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { youtubeAccounts } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/neon-auth'
import { readMobileState, youtubeAuthUrl, youtubeRedirectUri } from '@/lib/youtube-oauth'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  if (!code) return NextResponse.redirect(youtubeAuthUrl(url.origin))

  const mobile = readMobileState(url.searchParams.get('state'))
  const finish = (query: string) => mobile
    ? NextResponse.redirect(`${mobile.redirect}${mobile.redirect.includes('?') ? '&' : '?'}${query}`)
    : NextResponse.redirect(new URL(`/settings?${query}`, url.origin))

  const userId = mobile?.uid ?? (await getCurrentUser())?.id
  if (!userId) return NextResponse.redirect(new URL('/auth/login', url.origin))
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code, client_id: process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID || '', client_secret: process.env.YOUTUBE_CLIENT_SECRET || '', redirect_uri: youtubeRedirectUri(url.origin), grant_type: 'authorization_code' }) })
    if (!response.ok) return finish('error=token_exchange_failed')
    const tokens = await response.json()
    const existing = await db.select({ id: youtubeAccounts.id }).from(youtubeAccounts).where(eq(youtubeAccounts.userId, userId)).limit(1)
    const values = { userId, accessToken: tokens.access_token, refreshToken: tokens.refresh_token || null, expiresAt: new Date(Date.now() + Number(tokens.expires_in || 3600) * 1000) }
    if (existing[0]) await db.update(youtubeAccounts).set(values).where(eq(youtubeAccounts.id, existing[0].id))
    else await db.insert(youtubeAccounts).values({ id: crypto.randomUUID(), ...values })
    return finish('connected=true')
  } catch { return finish('error=youtube_auth_failed') }
}
