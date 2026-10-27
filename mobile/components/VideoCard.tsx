import { memo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { Check } from 'lucide-react-native'
import type { Video } from '@shared/types'
import { formatTimeAgo } from '@shared/feed'
import { makeStyles, radius, useTheme, watchColors } from '@/lib/theme'
import { Avatar } from './ui'

export type FeedVideo = Video & { channelThumbnail?: string | null }

const openChannel = (channelId: string | null) => channelId && router.push(`/channel/${channelId}`)

/** Web'deki components/video-card.tsx karşılığı (akış ve kanal sayfası). */
export const VideoCard = memo(function VideoCard({ video }: { video: FeedVideo }) {
  const { colors } = useTheme()
  const s = useStyles()
  return (
    <Pressable onPress={() => router.push(`/watch/${video.videoId}`)} style={({ pressed }) => pressed && { opacity: 0.85 }}>
      <View style={s.thumbnail}>
        <Thumbnail uri={video.thumbnailUrl} watched={video.isWatched} />
      </View>
      <View style={s.meta}>
        <Pressable onPress={() => openChannel(video.channelId)} hitSlop={6} accessibilityLabel={`Go to ${video.channelTitle}`}>
          <Avatar uri={video.channelThumbnail} name={video.channelTitle} size={36} />
        </Pressable>
        <View style={s.metaText}>
          <Text numberOfLines={2} style={s.title}>{video.title}</Text>
          <Pressable onPress={() => openChannel(video.channelId)} hitSlop={4}>
            <Text numberOfLines={1} style={[s.sub, s.channel]}>{video.channelTitle}</Text>
          </Pressable>
          <View style={s.row}>
            <Text style={s.sub}>{formatTimeAgo(video.publishedAt)}</Text>
            {video.isWatched ? <Check size={12} color={colors.success} strokeWidth={3} /> : null}
          </View>
        </View>
      </View>
    </Pressable>
  )
})

/** İzleme sayfasındaki yan liste satırı — web'deki RelatedVideoList (her zaman koyu). */
export const VideoRow = memo(function VideoRow({ video }: { video: FeedVideo }) {
  return (
    <View style={rowStyles.row}>
      <Pressable onPress={() => router.push(`/watch/${video.videoId}`)} style={rowStyles.thumb}>
        <Thumbnail uri={video.thumbnailUrl} watched={video.isWatched} compact />
      </Pressable>
      <View style={rowStyles.text}>
        <Pressable onPress={() => router.push(`/watch/${video.videoId}`)}>
          <Text numberOfLines={2} style={[rowStyles.title, video.isWatched && { color: watchColors.gray400 }]}>{video.title}</Text>
        </Pressable>
        <Pressable onPress={() => openChannel(video.channelId)} style={rowStyles.channel} hitSlop={4}>
          <Avatar uri={video.channelThumbnail} name={video.channelTitle} size={20} style={{ backgroundColor: watchColors.gray600 }} />
          <Text numberOfLines={1} style={rowStyles.channelName}>{video.channelTitle}</Text>
        </Pressable>
        <View style={rowStyles.channel}>
          <Text style={rowStyles.time}>{formatTimeAgo(video.publishedAt)}</Text>
          {video.isWatched ? <Check size={12} color={watchColors.success} strokeWidth={3} /> : null}
        </View>
      </View>
    </View>
  )
})

function Thumbnail({ uri, watched, compact }: { uri: string | null; watched: boolean; compact?: boolean }) {
  return (
    <>
      {uri ? <Image source={{ uri }} style={[StyleSheet.absoluteFill, watched && { opacity: 0.5 }]} contentFit="cover" transition={150} /> : null}
      {watched ? (
        <View style={thumbStyles.overlay}>
          <View style={[thumbStyles.badge, compact && thumbStyles.badgeCompact]}>
            <Check size={compact ? 14 : 20} color="#fff" strokeWidth={3} />
          </View>
          <Text style={[thumbStyles.label, compact && { fontSize: 10 }]}>Watched</Text>
        </View>
      ) : null}
    </>
  )
}

const useStyles = makeStyles((c) => StyleSheet.create({
  thumbnail: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: c.muted },
  meta: { flexDirection: 'row', gap: 12, marginTop: 12 },
  metaText: { flex: 1, minWidth: 0 },
  title: { color: c.foreground, fontSize: 14, fontWeight: '500', lineHeight: 19 },
  sub: { color: c.mutedForeground, fontSize: 12 },
  channel: { marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
}))

const thumbStyles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', gap: 4 },
  badge: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  badgeCompact: { width: 24, height: 24, borderRadius: 12 },
  label: { color: '#fff', fontSize: 12, fontWeight: '500' },
})

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  thumb: { width: 160, aspectRatio: 16 / 9, borderRadius: radius.md, overflow: 'hidden', backgroundColor: watchColors.gray800 },
  text: { flex: 1, minWidth: 0, paddingVertical: 2 },
  title: { color: watchColors.text, fontSize: 14, fontWeight: '500', lineHeight: 19 },
  channel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  channelName: { color: watchColors.gray400, fontSize: 12, flexShrink: 1 },
  time: { color: watchColors.gray500, fontSize: 12 },
})
