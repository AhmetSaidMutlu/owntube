// Web API'sinin (app/api/*) JSON yanıt tipleri. Veritabanı şemasından türetilir,
// böylece şema değişirse mobil uygulama derleme anında uyarı alır.
import type { Subscription as DbSubscription, Video as DbVideo } from '../lib/db/schema'

type Serialized<T> = {
  [K in keyof T]: T[K] extends Date ? string : T[K] extends Date | null ? string | null : T[K]
}

export type Video = Serialized<DbVideo>
export type RelatedVideo = Video & { channelThumbnail?: string | null }
export type Subscription = Serialized<DbSubscription>

export type VideosResponse = { videos: Video[] }
export type VideoResponse = { video: Video; related: RelatedVideo[] }
export type ChannelResponse = { subscription: Pick<Subscription, 'channelTitle' | 'channelThumbnail'> | null; videos: Video[] }
export type SubscriptionsResponse = { subscriptions: Subscription[] }
export type YoutubeStatusResponse = { connected: boolean; video_count: number; subscription_count: number }
export type SyncResponse = { success: true; videos_synced: number; subscriptions_count: number }
export type MarkWatchedResponse = { success: true; marked_watched: boolean }
export type UnsubscribeResponse = { success: true; videos_deleted: number; youtube_unsubscribed: boolean }
