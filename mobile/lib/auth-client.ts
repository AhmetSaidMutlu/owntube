import { createAuthClient } from 'better-auth/react'
import { expoClient } from '@better-auth/expo/client'
import * as SecureStore from 'expo-secure-store'
import { API_URL, IS_WEB } from './config'

// Web'deki lib/auth-client.ts'in mobil karşılığı: aynı Better Auth sunucusu,
// oturum çerezi SecureStore'da tutulur.
export const authClient = createAuthClient({
  baseURL: API_URL,
  ...(IS_WEB ? { fetchOptions: { credentials: 'include' as const } } : {}),
  plugins: [expoClient({ scheme: 'owntube', storagePrefix: 'owntube', storage: SecureStore })],
})
