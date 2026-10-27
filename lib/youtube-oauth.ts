import { createHmac, timingSafeEqual } from 'node:crypto'

// Mobil uygulama YouTube bağlantısını sistem tarayıcısında açar; tarayıcıda
// oturum çerezi olmadığı için kullanıcı kimliği imzalı `state` içinde taşınır.

const STATE_TTL_MS = 10 * 60 * 1000
const ALLOWED_MOBILE_SCHEMES = ['owntube:', 'exp:', 'exps:']

type MobileState = { uid: string; redirect: string; exp: number }

function secret() {
  const value = process.env.BETTER_AUTH_SECRET
  if (!value) throw new Error('BETTER_AUTH_SECRET is not set')
  return value
}

function sign(payload: string) {
  return createHmac('sha256', secret()).update(payload).digest('base64url')
}

export function youtubeRedirectUri(origin: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL || origin}/api/youtube-auth`
}

export function youtubeAuthUrl(origin: string, state?: string) {
  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID || '',
    redirect_uri: youtubeRedirectUri(origin),
    response_type: 'code',
    // Takipten çıkma (subscriptions.delete) için tam youtube kapsamı gerekir
    scope: 'https://www.googleapis.com/auth/youtube',
    access_type: 'offline',
    prompt: 'consent',
  })
  if (state) params.set('state', state)
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

// Geliştirmede mobil uygulamanın tarayıcı sürümü (expo web)
const DEV_WEB_ORIGINS = process.env.NODE_ENV === 'development' ? ['http://localhost:8081'] : []

export function isAllowedMobileRedirect(value: string) {
  try {
    const url = new URL(value)
    return ALLOWED_MOBILE_SCHEMES.includes(url.protocol) || DEV_WEB_ORIGINS.includes(url.origin)
  } catch {
    return false
  }
}

export function createMobileState(uid: string, redirect: string) {
  const payload = Buffer.from(JSON.stringify({ uid, redirect, exp: Date.now() + STATE_TTL_MS } satisfies MobileState)).toString('base64url')
  return `${payload}.${sign(payload)}`
}

export function readMobileState(state: string | null): MobileState | null {
  if (!state) return null
  const [payload, signature] = state.split('.')
  if (!payload || !signature) return null
  const expected = Buffer.from(sign(payload))
  const received = Buffer.from(signature)
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as MobileState
    if (data.exp < Date.now() || !isAllowedMobileRedirect(data.redirect)) return null
    return data
  } catch {
    return null
  }
}
