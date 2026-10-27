import { memo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import type { Video } from '@shared/types'
import { formatTimeAgo } from '@shared/feed'
import { radii, theme } from '@/lib/theme'
import { Avatar } from './ui'

export type FeedVideo = Video & { channelThumbnail?: string | null }

/** Büyük kart (akış ve kanal ekranı) — web'deki components/video-card.tsx karşılığı. */
export const VideoCard = memo(function VideoCard({ video, showChannel = true }: { video: FeedVideo; showChannel?: boolean }) {
  const openChannel = () => video.channelId && router.push(`/channel/${video.channelId}`)
  return (
    <Pressable onPress={() => router.push(`/watch/${video.videoId}`)} style={({ pressed }) => pressed && styles.pressed}>
      <Thumbnail uri={video.thumbnailUrl} watched={video.isWatched} style={styles.thumbnail} />
      <View style={styles.meta}>
        {showChannel ? (
          <Pressable onPress={openChannel} hitSlop={6}>
            <Avatar uri={video.channelThumbnail} name={video.channelTitle} size={36} />
          </Pressable>
        ) : null}
        <View style={styles.metaText}>
          <Text numberOfLines={2} style={[styles.title, video.isWatched && styles.watchedText]}>{video.title}</Text>
          <Text numberOfLines={1} style={styles.sub}>
            {showChannel && video.channelTitle ? `${video.channelTitle} · ` : ''}{formatTimeAgo(video.publishedAt)}
          </Text>
        </View>
      </View>
    </Pressable>
  )
})

/** Yatay satır (izleme ekranındaki "sıradaki" listesi). */
export const VideoRow = memo(function VideoRow({ video }: { video: FeedVideo }) {
  return (
    <Pressable onPress={() => router.push(`/watch/${video.videoId}`)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <Thumbnail uri={video.thumbnailUrl} watched={video.isWatched} style={styles.rowThumb} compact />
      <View style={styles.rowText}>
        <Text numberOfLines={2} style={[styles.rowTitle, video.isWatched && styles.watchedText]}>{video.title}</Text>
        <Pressable onPress={() => video.channelId && router.push(`/channel/${video.channelId}`)} style={styles.rowChannel} hitSlop={4}>
          <Avatar uri={video.channelThumbnail} name={video.channelTitle} size={18} />
          <Text numberOfLines={1} style={styles.rowSub}>{video.channelTitle}</Text>
        </Pressable>
        <View style={styles.rowChannel}>
          <Text style={styles.rowSub}>{formatTimeAgo(video.publishedAt)}</Text>
          {video.isWatched ? <Ionicons name="checkmark-circle" size={12} color={theme.success} /> : null}
        </View>
      </View>
    </Pressable>
  )
})

function Thumbnail({ uri, watched, style, compact }: { uri: string | null; watched: boolean; style: object; compact?: boolean }) {
  return (
    <View style={[style, styles.thumbWrap]}>
      {uri ? <Image source={{ uri }} style={[StyleSheet.absoluteFill, watched && styles.watchedImage]} contentFit="cover" transition={150} /> : null}
      {watched ? (
        <View style={styles.watchedOverlay}>
          <Ionicons name="checkmark" size={compact ? 14 : 18} color="#fff" />
          <Text style={[styles.watchedLabel, compact && { fontSize: 10 }]}>Watched</Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.85 },
  thumbWrap: { overflow: 'hidden', backgroundColor: theme.surfaceRaised },
  thumbnail: { width: '100%', aspectRatio: 16 / 9, borderRadius: radii.card },
  watchedImage: { opacity: 0.5 },
  watchedOverlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.35)', gap: 2 },
  watchedLabel: { color: '#fff', fontSize: 12, fontWeight: '600' },
  meta: { flexDirection: 'row', gap: 12, paddingTop: 10, paddingHorizontal: 2 },
  metaText: { flex: 1, gap: 4 },
  title: { color: theme.text, fontSize: 15, fontWeight: '600', lineHeight: 21 },
  watchedText: { color: theme.muted },
  sub: { color: theme.muted, fontSize: 12 },
  row: { flexDirection: 'row', gap: 10 },
  rowThumb: { width: 160, aspectRatio: 16 / 9, borderRadius: 8 },
  rowText: { flex: 1, gap: 4, paddingVertical: 2 },
  rowTitle: { color: theme.text, fontSize: 14, fontWeight: '600', lineHeight: 19 },
  rowChannel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowSub: { color: theme.muted, fontSize: 12, flexShrink: 1 },
})
