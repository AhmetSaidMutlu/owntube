import type {
  ChannelResponse,
  MarkWatchedResponse,
  SubscriptionsResponse,
  SyncResponse,
  UnsubscribeResponse,
  VideoResponse,
  VideosResponse,
  YoutubeStatusResponse,
} from '@shared/types'
import { WATCHED_PERCENTAGE } from '@shared/feed'
import { authClient } from './auth-client'
import { API_URL, IS_WEB } from './config'
import { fetchWithTimeout } from './http'

export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message)
  }
}

// Web sayfalarının çağırdığı /api/* uçlarının aynısı; oturum, Better Auth çereziyle taşınır.
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  // Tarayıcı çerezi kendisi gönderir; native'de çerez SecureStore'dan elle eklenir.
  const cookie = IS_WEB ? null : await authClient.getCookie()
  const response = await fetchWithTimeout(`${API_URL}${path}`, {
    ...init,
    credentials: IS_WEB ? 'include' : 'omit',
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new ApiError(data?.error ?? `Request failed (${response.status})`, response.status, data?.code)
  return data as T
}

const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) })

export const api = {
  videos: (limit: number, offset: number) => request<VideosResponse>(`/api/videos?limit=${limit}&offset=${offset}`),
  video: (videoId: string) => request<VideoResponse>(`/api/videos/${encodeURIComponent(videoId)}`),
  channel: (channelId: string) => request<ChannelResponse>(`/api/channel/${encodeURIComponent(channelId)}`),
  /** Kanalı YouTube'da takipten çıkarır ve kanala ait videoları veritabanından siler. */
  unsubscribeChannel: (channelId: string) =>
    request<UnsubscribeResponse>(`/api/channel/${encodeURIComponent(channelId)}`, { method: 'DELETE' }),
  subscriptions: () => request<SubscriptionsResponse>('/api/subscriptions'),
  setSubscriptionActive: (channelId: string, isActive: boolean) =>
    request<{ success: true }>('/api/subscriptions', { method: 'PATCH', body: JSON.stringify({ channelId, isActive }) }),
  sync: () => post<SyncResponse>('/api/sync-videos'),
  youtubeStatus: () => request<YoutubeStatusResponse>('/api/youtube-status'),
  youtubeDisconnect: () => post<{ success: true }>('/api/youtube-disconnect'),
  youtubeConnectUrl: (redirect: string) => post<{ url: string }>('/api/youtube-auth/mobile', { redirect }),
  /** `id` videonun veritabanı kimliğidir (YouTube videoId değil). */
  markWatched: (id: string) => post<MarkWatchedResponse>('/api/mark-watched', { videoId: id, watchedPercentage: WATCHED_PERCENTAGE }),
}

/** Web'deki dashboard ile aynı hata mesajı eşlemesi. */
export function syncErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : ''
  if (message.includes('quotaExceeded') || message.includes('quota')) {
    return 'YouTube API quota exceeded. Quotas reset at midnight UTC.'
  }
  if (message === 'No YouTube connection') return 'Connect your YouTube account first.'
  return message || 'Failed to sync videos'
}
