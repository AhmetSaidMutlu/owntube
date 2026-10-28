import { useCallback, useEffect, useRef, useState } from 'react'
import { FlatList, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, ChevronDown, ChevronUp, ExternalLink, Settings, Share2, type LucideIcon } from 'lucide-react-native'
import type { RelatedVideo, Video } from '@shared/types'
import { formatTimeAgo, orderRelated, WATCHED_AFTER_SECONDS } from '@shared/feed'
import { api } from '@/lib/api'
import { emitVideoWatched } from '@/lib/watched-store'
import { YouTubePlayer } from '@/components/YouTubePlayer'
import { VideoRow } from '@/components/VideoCard'
import { Avatar } from '@/components/ui'
import { radius, watchColors as w } from '@/lib/theme'

const RELATED_PAGE_SIZE = 20

// Web'deki app/(protected)/watch/[id]/page.tsx karşılığı (her temada koyu).
export default function WatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [video, setVideo] = useState<Video | null>(null)
  const [pool, setPool] = useState<RelatedVideo[]>([])
  const [visible, setVisible] = useState(RELATED_PAGE_SIZE)
  const [expanded, setExpanded] = useState(false)
  const [onlyChannel, setOnlyChannel] = useState(false)
  const markedRef = useRef(false)
  const insets = useSafeAreaInsets()

  useEffect(() => {
    if (!id) return
    setVideo(null)
    setVisible(RELATED_PAGE_SIZE)
    setExpanded(false)
    setOnlyChannel(false)
    markedRef.current = false
    api.video(id)
      .then(({ video: current, related }) => {
        setVideo(current)
        setPool(orderRelated(related, current.channelId))
      })
      .catch(() => router.back())
  }, [id])

  // Web ile aynı kural: belirli bir süre izlenen video "izlendi" olur.
  const onPlaySecond = useCallback((seconds: number) => {
    if (!video || markedRef.current || seconds < WATCHED_AFTER_SECONDS) return
    markedRef.current = true
    api.markWatched(video.id)
      .then(() => emitVideoWatched(video.videoId))
      .catch(() => { markedRef.current = false })
  }, [video])

  if (!video) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.loading}><Text style={styles.loadingText}>Loading...</Text></View>
      </View>
    )
  }

  const channelThumbnail = pool.find((v) => v.channelId === video.channelId)?.channelThumbnail
  const youtubeUrl = `https://www.youtube.com/watch?v=${video.videoId}`
  const openChannel = () => video.channelId && router.push(`/channel/${video.channelId}`)
  const filtered = onlyChannel ? pool.filter((v) => v.channelId === video.channelId) : pool
  const related = filtered.slice(0, visible)
  const channelTitle = video.channelTitle ?? ''
  const shortChannel = channelTitle.length > 20 ? `${channelTitle.slice(0, 20)}…` : channelTitle

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View>
        <YouTubePlayer videoId={video.videoId} onPlaySecond={onPlaySecond} />
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={10} accessibilityLabel="Go back">
          <ArrowLeft size={20} color="#fff" />
        </Pressable>
      </View>

      <FlatList
        data={related}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: 32 + insets.bottom }]}
        onEndReached={() => visible < filtered.length && setVisible((n) => n + RELATED_PAGE_SIZE)}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <View>
            <View style={styles.info}>
              <Text style={styles.title}>{video.title}</Text>

              <Pressable onPress={openChannel} style={styles.channel}>
                <Avatar uri={channelThumbnail} name={channelTitle} size={36} style={{ backgroundColor: w.gray600 }} />
                <Text numberOfLines={1} style={styles.channelName}>{channelTitle}</Text>
              </Pressable>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actions}>
                <Chip icon={Share2} label="Share" onPress={() => Share.share({ message: `${video.title}\n${youtubeUrl}`, url: youtubeUrl })} />
                <Chip icon={ExternalLink} label="YouTube" onPress={() => Linking.openURL(youtubeUrl)} />
                <Chip icon={Settings} label="HD" onPress={() => Linking.openURL(`${youtubeUrl}&vq=hd1080`)} highlight />
              </ScrollView>

              <Pressable onPress={() => setExpanded((v) => !v)} style={styles.description}>
                <Text style={styles.descriptionMeta}>{formatTimeAgo(video.publishedAt)}</Text>
                <Text style={styles.descriptionText} numberOfLines={expanded ? undefined : 3}>
                  {video.description || 'No description available.'}
                </Text>
                {video.description && video.description.length > 120 ? (
                  <View style={styles.more}>
                    {expanded ? <ChevronUp size={16} color={w.text} /> : <ChevronDown size={16} color={w.text} />}
                    <Text style={styles.moreText}>{expanded ? 'Show less' : 'Show more'}</Text>
                  </View>
                ) : null}
              </Pressable>
            </View>

            {pool.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
                <FilterChip label="All" active={!onlyChannel} onPress={() => { setOnlyChannel(false); setVisible(RELATED_PAGE_SIZE) }} />
                <FilterChip label={`From ${shortChannel}`} active={onlyChannel} onPress={() => { setOnlyChannel(true); setVisible(RELATED_PAGE_SIZE) }} />
              </ScrollView>
            ) : null}
          </View>
        }
        renderItem={({ item }) => <View style={styles.rowWrap}><VideoRow video={item} /></View>}
        ListFooterComponent={
          related.length > 0 ? (
            <View style={styles.footer}>
              <Text style={styles.footerText}>{visible < filtered.length ? 'Yükleniyor…' : 'Tüm videolar yüklendi'}</Text>
            </View>
          ) : undefined
        }
      />
    </View>
  )
}

function Chip({ icon: Icon, label, onPress, highlight }: { icon: LucideIcon; label: string; onPress: () => void; highlight?: boolean }) {
  const color = highlight ? w.yellowText : w.text
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, highlight && { backgroundColor: w.yellowBg }, pressed && { opacity: 0.7 }]}>
      <Icon size={16} color={color} />
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </Pressable>
  )
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.filter, active && styles.filterActive]}>
      <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: w.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  loadingText: { color: w.text, fontSize: 14 },
  back: { position: 'absolute', top: 12, left: 12, padding: 8, borderRadius: radius.full, backgroundColor: 'rgba(0,0,0,0.5)' },
  list: { paddingBottom: 32 },
  info: { paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  title: { color: w.text, fontSize: 16, fontWeight: '600', lineHeight: 22 },
  channel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  channelName: { color: w.text, fontSize: 14, fontWeight: '500', flexShrink: 1 },
  actions: { gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: w.chip, borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontSize: 14, fontWeight: '500' },
  description: { backgroundColor: w.chip, borderRadius: radius.xl, padding: 12 },
  descriptionMeta: { color: w.gray400, fontSize: 14, marginBottom: 6 },
  descriptionText: { color: w.gray200, fontSize: 14, lineHeight: 20 },
  more: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  moreText: { color: w.text, fontSize: 14, fontWeight: '500' },
  filters: { gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  filter: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.md, backgroundColor: w.chip },
  filterActive: { backgroundColor: '#fff' },
  filterText: { color: w.text, fontSize: 14, fontWeight: '500' },
  filterTextActive: { color: '#000' },
  rowWrap: { paddingHorizontal: 16, paddingBottom: 12 },
  footer: { minHeight: 40, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  footerText: { color: w.gray600, fontSize: 12 },
})
