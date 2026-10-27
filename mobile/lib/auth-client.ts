import { createAuthClient } from 'better-auth/react'
import { expoClient } from '@better-auth/expo/client'
import { API_URL, IS_WEB } from './config'
import { fetchWithTimeout } from './http'
import { safeStorage } from './safe-storage'

// Web'deki lib/auth-client.ts'in mobil karşılığı: aynı Better Auth sunucusu,
// oturum çerezi SecureStore'da tutulur. Better Auth'un kendi `timeout` seçeneği istek
// bir iptal sinyali taşıdığında devre dışı kaldığından zaman aşımı fetch katmanında uygulanır.
export const authClient = createAuthClient({
  baseURL: API_URL,
  fetchOptions: {
    customFetchImpl: fetchWithTimeout,
    ...(IS_WEB ? { credentials: 'include' as const } : {}),
  },
  plugins: [expoClient({ scheme: 'owntube', storagePrefix: 'owntube', storage: safeStorage })],
})
