// Web ve mobilin ortak kullandığı akış kuralları. Saf TypeScript: DOM ya da React Native'e bağımlı değil.

type Sortable = { isWatched: boolean; publishedAt: string | null }

const NEW_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Akıllı sıralama — 4 öncelik grubu:
 * 1. İzlenmemiş + Yeni  (son 7 gün)     → yeniden eskiye
 * 2. İzlenmemiş + Eski  (7 günden eski) → eskiden yeniye
 * 3. İzlenmiş   + Eski                  → eskiden yeniye
 * 4. İzlenmiş   + Yeni                  → yeniden eskiye
 */
export function smartSort<T extends Sortable>(videos: T[], now = Date.now()): T[] {
  const time = (v: T) => (v.publishedAt ? new Date(v.publishedAt).getTime() : 0)
  const bucket = (v: T) => {
    const isNew = now - time(v) < NEW_THRESHOLD_MS
    if (!v.isWatched) return isNew ? 1 : 2
    return isNew ? 4 : 3
  }
  return [...videos].sort((a, b) => {
    const ba = bucket(a)
    const bb = bucket(b)
    if (ba !== bb) return ba - bb
    return ba === 1 || ba === 4 ? time(b) - time(a) : time(a) - time(b)
  })
}

/** İzleme sayfasındaki "sıradaki" listesi: aynı kanal (izlenmemiş) → diğer izlenmemişler → izlenmişler, her grup karışık. */
export function orderRelated<T extends { isWatched: boolean; channelId: string | null }>(pool: T[], channelId: string | null): T[] {
  const shuffle = (items: T[]) => [...items].sort(() => Math.random() - 0.5)
  const sameChannel = pool.filter((v) => !v.isWatched && channelId && v.channelId === channelId)
  const unwatched = pool.filter((v) => !v.isWatched && !(channelId && v.channelId === channelId))
  const watched = pool.filter((v) => v.isWatched)
  return [...shuffle(sameChannel), ...shuffle(unwatched), ...shuffle(watched)]
}

/** Bu süre boyunca izlenen video "izlendi" olarak işaretlenir (web ile aynı kural). */
export const WATCHED_AFTER_SECONDS = 10
/** /api/mark-watched en az %30 bekler; web de bu sabit değeri gönderir. */
export const WATCHED_PERCENTAGE = 35

export function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return ''
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ]
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds)
    if (count >= 1) return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`
  }
  return 'Just now'
}
