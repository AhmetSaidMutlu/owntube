import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/neon-auth'
import { createMobileState, isAllowedMobileRedirect, youtubeAuthUrl } from '@/lib/youtube-oauth'

// Mobil uygulama oturumuyla çağrılır, tarayıcıda açılacak Google izin adresini döner.
export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { redirect } = await request.json().catch(() => ({}))
  if (typeof redirect !== 'string' || !isAllowedMobileRedirect(redirect)) return NextResponse.json({ error: 'Invalid redirect' }, { status: 400 })
  return NextResponse.json({ url: youtubeAuthUrl(new URL(request.url).origin, createMobileState(user.id, redirect)) })
}
