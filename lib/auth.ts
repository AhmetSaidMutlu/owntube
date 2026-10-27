import { betterAuth } from 'better-auth'
import { expo } from '@better-auth/expo'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { bearer } from 'better-auth/plugins'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'

const originCandidates = [
  process.env.BETTER_AUTH_URL,
  // Mobil uygulamanın deep link şeması (mobile/app.json → scheme)
  'owntube://',
  ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000', 'http://localhost:8081', 'exp://', 'exp://**'] : []),
].filter((value): value is string => Boolean(value))

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  baseURL: originCandidates[0],
  trustedOrigins: [...new Set(originCandidates)],
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId: process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID || '',
      clientSecret: process.env.YOUTUBE_CLIENT_SECRET || '',
    },
  },
  plugins: [expo(), bearer(), nextCookies()],
  ...(process.env.NODE_ENV === 'development'
    ? {
        advanced: {
          defaultCookieAttributes: {
            sameSite: 'none' as const,
            secure: true,
          },
        },
      }
    : {}),
})
