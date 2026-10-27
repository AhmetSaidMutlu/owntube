// React Native Android'de (OkHttp) bağlantı ve okuma zaman aşımı kapalıdır; takılan bir
// istek sonsuza dek bekler. Tüm istekler bu sarmalayıcıdan geçer.
export const REQUEST_TIMEOUT_MS = 20000

export class TimeoutError extends Error {
  constructor() {
    super('Sunucu yanıt vermedi (zaman aşımı)')
    this.name = 'TimeoutError'
  }
}

export async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)
  // Çağıranın kendi iptal sinyali (ör. Better Auth oturum isteği) de korunur.
  const outer = init.signal
  const forwardAbort = () => controller.abort()
  if (outer) {
    if (outer.aborted) controller.abort()
    else outer.addEventListener('abort', forwardAbort)
  }
  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } catch (error) {
    if (timedOut) throw new TimeoutError()
    throw error
  } finally {
    clearTimeout(timer)
    outer?.removeEventListener('abort', forwardAbort)
  }
}
