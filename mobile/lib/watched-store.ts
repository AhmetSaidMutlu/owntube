// Ekranlar arası küçük olay kanalı: izleme ekranında "izlendi" işaretlenen ya da
// akıştan kaydırılarak gizlenen videoları liste ekranları anında yansıtır.

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
