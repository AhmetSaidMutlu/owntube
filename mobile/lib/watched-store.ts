// Ekranlar arası küçük olay kanalı: izleme ekranında "izlendi" işaretlenen ya da
// akıştan kaydırılarak gizlenen videoları ve yeni senkronizasyonları liste ekranları anında yansıtır.

type Listener = (videoId: string) => void

const watchedListeners = new Set<Listener>()

// Web'de sessionStorage'da tutulur; mobilde uygulama açık kaldığı sürece geçerli.
export const dismissedVideoIds = new Set<string>()

export function onVideoWatched(listener: Listener) {
  watchedListeners.add(listener)
  return () => { watchedListeners.delete(listener) }
}

export function emitVideoWatched(videoId: string) {
  watchedListeners.forEach((listener) => listener(videoId))
}

// Üst çubuktaki Sync düğmesi senkronizasyon bitince video listesini yeniler.
const syncedListeners = new Set<() => void>()

export function onVideosSynced(listener: () => void) {
  syncedListeners.add(listener)
  return () => { syncedListeners.delete(listener) }
}

export function emitVideosSynced() {
  syncedListeners.forEach((listener) => listener())
}
