export interface YouTubeChannel {
  id: string
  title: string
  thumbnail: string
}

export interface YouTubeVideo {
  id: string
  title: string
  description: string
  thumbnail: string
  channelId: string
  channelTitle: string
  publishedAt: string
  url: string
}

// Get authenticated user's subscriptions
// QUOTA: 1 unit per page (50 results/page)
// Abonelik listesi nadiren değişir — sync-videos içinde 24 saatte bir çağır
export async function getSubscriptions(accessToken: string, maxPages: number = 10): Promise<YouTubeChannel[]> {
  const channels: YouTubeChannel[] = []
  let nextPageToken = ''
  let pageCount = 0

  while (pageCount < maxPages) {
    const url = new URL('https://www.googleapis.com/youtube/v3/subscriptions')
    url.searchParams.append('part', 'snippet')
    url.searchParams.append('mine', 'true')
    url.searchParams.append('maxResults', '50')
    url.searchParams.append('fields', 'items(snippet(resourceId/channelId,title,thumbnails/default/url)),nextPageToken')
    if (nextPageToken) url.searchParams.append('pageToken', nextPageToken)

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`YouTube API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()

    data.items?.forEach((item: any) => {
      channels.push({
        id: item.snippet.resourceId.channelId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails?.default?.url ?? '',
      })
    })

    nextPageToken = data.nextPageToken
    pageCount++
    if (!nextPageToken) break
  }

  return channels
}

export class YouTubeApiError extends Error {
  constructor(message: string, readonly status: number, readonly reason?: string) {
    super(message)
  }
}

async function youtubeError(response: Response) {
  const text = await response.text()
  let reason: string | undefined
  try { reason = JSON.parse(text)?.error?.errors?.[0]?.reason } catch {}
  return new YouTubeApiError(`YouTube API error: ${response.status} - ${text}`, response.status, reason)
}

// Unsubscribe the authenticated user from a channel
// QUOTA: 1 unit (subscriptions.list) + 50 units (subscriptions.delete)
// Requires the full `youtube` scope; readonly tokens fail with 403 insufficientPermissions
// Returns false if the user was not subscribed on YouTube
export async function unsubscribeFromChannel(accessToken: string, channelId: string): Promise<boolean> {
  const url = new URL('https://www.googleapis.com/youtube/v3/subscriptions')
  url.searchParams.append('part', 'id')
  url.searchParams.append('mine', 'true')
  url.searchParams.append('forChannelId', channelId)
  url.searchParams.append('fields', 'items/id')

  const listResponse = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!listResponse.ok) throw await youtubeError(listResponse)

  const subscriptionId: string | undefined = (await listResponse.json()).items?.[0]?.id
  if (!subscriptionId) return false

  const deleteResponse = await fetch(`https://www.googleapis.com/youtube/v3/subscriptions?id=${encodeURIComponent(subscriptionId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!deleteResponse.ok && deleteResponse.status !== 404) throw await youtubeError(deleteResponse)
  return true
}

// Get videos from specified channels using activities.list
// QUOTA: 1 unit per channel (search.list = 100 unit per channel!)
// 100 kanal → 100 unit (eski kodda 10.000 unit idi)
export async function getVideosFromChannels(
  accessToken: string,
  channelIds: string[],
  publishedAfter?: string
): Promise<YouTubeVideo[]> {
  const videos: YouTubeVideo[] = []

  for (const channelId of channelIds) {
    const url = new URL('https://www.googleapis.com/youtube/v3/activities')
    url.searchParams.append('part', 'snippet,contentDetails')
    url.searchParams.append('channelId', channelId)
    url.searchParams.append('maxResults', '10')
    url.searchParams.append('fields', 'items(snippet(publishedAt,title,description,thumbnails/medium/url,channelId,channelTitle),contentDetails/upload/videoId)')
    if (publishedAfter) url.searchParams.append('publishedAfter', publishedAfter)

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!response.ok) continue

    const data = await response.json()

    data.items?.forEach((item: any) => {
      const videoId = item.contentDetails?.upload?.videoId
      // activities.list hem upload hem playlist vb. döner — sadece upload olanları al
      if (!videoId) return

      videos.push({
        id: videoId,
        title: item.snippet.title,
        description: item.snippet.description ?? '',
        thumbnail: item.snippet.thumbnails?.medium?.url ?? '',
        channelId: item.snippet.channelId,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        url: `https://www.youtube.com/watch?v=${videoId}`,
      })
    })
  }

  return videos
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  })
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

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