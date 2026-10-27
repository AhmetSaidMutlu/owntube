import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, Linking, Pressable, Share, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import type { RelatedVideo, Video } from '@shared/types'
import { formatTimeAgo, orderRelated, WATCHED_AFTER_SECONDS } from '@shared/feed'
import { api } from '@/lib/api'
import { emitVideoWatched } from '@/lib/watched-store'
import { YouTubePlayer } from '@/components/YouTubePlayer'
import { VideoRow } from '@/components/VideoCard'
import { Avatar, Loading } from '@/components/ui'
import { radii, theme } from '@/lib/theme'

const RELATED_PAGE_SIZE = 20

// Web'deki app/(protected)/watch/[id]/page.tsx karşılığı.
export default function WatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [video, setVideo] = useState<Video | null>(null)
  const [pool, setPool] = useState<RelatedVideo[]>([])
  const [visible, setVisible] = useState(RELATED_PAGE_SIZE)
  const [expanded, setExpanded] = useState(false)
  const [watched, setWatched] = useState(false)
  const markedRef = useRef(false)

  useEffect(() => {
    if (!id) return
    setVideo(null)
    setVisible(RELATED_PAGE_SIZE)
    setExpanded(false)
    markedRef.current = false
    api.video(id)
      .then(({ video: current, related }) => {
        setVideo(current)
        setWatched(current.isWatched)
        setPool(orderRelated(related, current.channelId))
      })
      .catch(() => router.back())
  }, [id])

  // Web ile aynı kural: belirli bir süre izlenen video "izlendi" olur.
  const onPlaySecond = useCallback((seconds: number) => {
    if (!video || markedRef.current || seconds < WATCHED_AFTER_SECONDS) return
    markedRef.current = true
    api.markWatched(video.id)
      .then(() => {
        setWatched(true)
        emitVideoWatched(video.videoId)
      })
      .catch(() => { markedRef.current = false })
  }, [video])

  if (!video) return <Loading />

  const channelThumbnail = pool.find((v) => v.channelId === video.channelId)?.channelThumbnail
  const youtubeUrl = `https://www.youtube.com/watch?v=${video.videoId}`
  const openChannel = () => video.channelId && router.push(`/channel/${video.channelId}`)
  const related = pool.slice(0, visible)

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View>
        <YouTubePlayer videoId={video.videoId} onPlaySecond={onPlaySecond} />
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={10}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </Pressable>
      </View>

      <FlatList
        data={related}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onEndReached={() => visible < pool.length && setVisible((n) => n + RELATED_PAGE_SIZE)}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <View style={styles.info}>
            <Text style={styles.title}>{video.title}</Text>

            <View style={styles.channelRow}>
              <Pressable onPress={openChannel} style={styles.channel}>
                <Avatar uri={channelThumbnail} name={video.channelTitle} size={36} />
                <Text numberOfLines={1} style={styles.channelName}>{video.channelTitle}</Text>
              </Pressable>
              {watched ? (
                <View style={styles.watchedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={theme.success} />
                  <Text style={styles.watchedText}>Watched</Text>
                </View>
              ) : undefined}
            </View>

            <View style={styles.actions}>
              <Chip icon="share-social-outline" label="Share" onPress={() => Share.share({ message: `${video.title}\n${youtubeUrl}`, url: youtubeUrl })} />
              <Chip icon="logo-youtube" label="YouTube" onPress={() => Linking.openURL(youtubeUrl)} />
            </View>

            <Pressable onPress={() => setExpanded((v) => !v)} style={styles.description}>
              <Text style={styles.descriptionMeta}>{formatTimeAgo(video.publishedAt)}</Text>
              <Text style={styles.descriptionText} numberOfLines={expanded ? undefined : 3}>
                {video.description || 'No description available.'}
              </Text>
              {video.description && video.description.length > 120 ? (
                <Text style={styles.more}>{expanded ? 'Show less' : 'Show more'}</Text>
              ) : undefined}
            </Pressable>

            {pool.length > 0 ? <Text style={styles.section}>Up next</Text> : null}
          </View>
        }
        renderItem={({ item }) => <VideoRow video={item} />}
        ListFooterComponent={
          pool.length > 0 ? (
            <View style={styles.footer}>
              {visible < pool.length ? <ActivityIndicator color={theme.muted} /> : <Text style={styles.footerText}>All videos loaded</Text>}
            </View>
          ) : undefined
        }
      />
    </SafeAreaView>
  )
}

function Chip({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, pressed && { opacity: 0.7 }]}>
      <Ionicons name={icon} size={16} color={theme.text} />
      <Text style={styles.chipText}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  back: { position: 'absolute', top: 10, left: 10, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  info: { paddingTop: 12, gap: 12 },
  title: { color: theme.text, fontSize: 17, fontWeight: '700', lineHeight: 23 },
  channelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  channel: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  channelName: { color: theme.text, fontSize: 15, fontWeight: '600', flexShrink: 1 },
  watchedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  watchedText: { color: theme.success, fontSize: 12, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.surfaceRaised, borderRadius: radii.pill, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { color: theme.text, fontSize: 13, fontWeight: '600' },
  description: { backgroundColor: theme.surface, borderRadius: radii.card, padding: 12, gap: 6 },
  descriptionMeta: { color: theme.muted, fontSize: 13, fontWeight: '600' },
  descriptionText: { color: theme.text, fontSize: 14, lineHeight: 20 },
  more: { color: theme.text, fontSize: 13, fontWeight: '700' },
  section: { color: theme.text, fontSize: 16, fontWeight: '700', marginTop: 4 },
  footer: { minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  footerText: { color: theme.subtle, fontSize: 12 },
})
