import * as SecureStore from 'expo-secure-store'

// Bazı cihazlarda (ör. Android 10 / One UI) Keystore çağrıları takılabiliyor ya da hata
// fırlatabiliyor. Oturum kontrolü depolamayı beklediği için bu, uygulamanın sonsuza dek
// yükleniyor ekranında kalmasına yol açar. Her çağrı zaman sınırlıdır ve hata vermez.
const STORAGE_TIMEOUT_MS = 4000

function withTimeout<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), STORAGE_TIMEOUT_MS)
    promise
      .then((value) => resolve(value))
      .catch(() => resolve(fallback))
      .finally(() => clearTimeout(timer))
  })
}

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      return SecureStore.getItem(key)
    } catch {
      return null
    }
  },
  setItem(key: string, value: string) {
    try {
      SecureStore.setItem(key, value)
    } catch {}
  },
  getItemAsync(key: string) {
    return withTimeout(SecureStore.getItemAsync(key), null)
  },
  setItemAsync(key: string, value: string) {
    return withTimeout(SecureStore.setItemAsync(key, value), undefined)
  },
}
