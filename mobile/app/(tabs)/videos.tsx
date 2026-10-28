import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Video } from 'lucide-react-native'
import { smartSort } from '@shared/feed'
import { api } from '@/lib/api'
import { dismissedVideoIds, onVideoWatched, onVideosSynced } from '@/lib/watched-store'
import { VideoCard, type FeedVideo } from '@/components/VideoCard'
import { SwipeToDismiss } from '@/components/SwipeToDismiss'
import { Alert, Empty, Skeleton } from '@/components/ui'
import { makeStyles, radius, useTheme } from '@/lib/theme'

const PAGE_SIZE = 20

// Web'deki app/(protected)/videos/page.tsx karşılığı: akıllı sıralama, sonsuz kaydırma,
// aşağı çekerek yenileme, kaydırarak gizleme.
export default function VideosScreen() {
  const { colors } = useTheme()
  const s = useStyles()
  const [videos, setVideos] = useState<FeedVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const pageRef = useRef(0)
  const hasMoreRef = useRef(true)
  const fetchingRef = useRef(false)
  const thumbsRef = useRef<Record<string, string>>({})
  const videosRef = useRef<FeedVideo[]>([])

  const setVideosSynced = useCallback((items: FeedVideo[]) => {
    videosRef.current = items
    setVideos(items)
  }, [])

  const loadThumbs = useCallback(async () => {
    const { subscriptions } = await api.subscriptions()
    const map: Record<string, string> = {}
    for (const sub of subscriptions) if (sub.channelThumbnail) map[sub.channelId] = sub.channelThumbnail
    thumbsRef.current = map
  }, [])

  const fetchPage = useCallback(async (page: number, replace = false) => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    try {
      const { videos: data } = await api.videos(PAGE_SIZE, page * PAGE_SIZE)
      hasMoreRef.current = data.length >= PAGE_SIZE
      const rows = data
        .filter((v) => !dismissedVideoIds.has(v.videoId))
        .map((v) => ({ ...v, channelThumbnail: v.channelId ? thumbsRef.current[v.channelId] : null }))
      setVideosSynced(smartSort([...(replace ? [] : videosRef.current), ...rows]))
      pageRef.current = page
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load videos')
    } finally {
      fetchingRef.current = false
    }
  }, [setVideosSynced])

  const reload = useCallback(async () => {
    hasMoreRef.current = true
    await loadThumbs().catch(() => {})
    await fetchPage(0, true)
  }, [loadThumbs, fetchPage])

  useEffect(() => {
    reload().finally(() => setLoading(false))
  }, [reload])

  // İzleme ekranında izlendi işaretlenen video, sıra bozulmadan güncellenir.
  useEffect(() => onVideoWatched((videoId) => {
    setVideosSynced(videosRef.current.map((v) => (v.videoId === videoId ? { ...v, isWatched: true } : v)))
  }), [setVideosSynced])

  async function onRefresh() {
    setRefreshing(true)
    await reload()
    setRefreshing(false)
  }

  // Üst çubuktaki Sync düğmesi bitince akış yeniden yüklenir.
  useEffect(() => onVideosSynced(() => { reload() }), [reload])

  async function onEndReached() {
    if (!hasMoreRef.current || fetchingRef.current || loading) return
    setLoadingMore(true)
    await fetchPage(pageRef.current + 1)
    setLoadingMore(false)
  }

  const dismiss = useCallback((videoId: string) => {
    dismissedVideoIds.add(videoId)
    setVideosSynced(videosRef.current.filter((v) => v.videoId !== videoId))
  }, [setVideosSynced])

  return (
    <View style={s.screen}>
      {loading ? (
        <ScrollView contentContainerStyle={s.list} scrollEnabled={false}>
          {Array.from({ length: 4 }).map((_, i) => <VideoSkeleton key={i} />)}
        </ScrollView>
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.mutedForeground} colors={[colors.foreground]} progressBackgroundColor={colors.card} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.6}
          ListHeaderComponent={
            error || videos.length > 0 ? (
              <View style={s.listHeader}>
                <Alert message={error} />
                {videos.length > 0 ? <Text style={s.hint}>💡 Bir videoyu görmek istemiyorsan sola veya sağa kaydır</Text> : null}
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <Empty icon={Video} title="No videos yet" description="Press Sync to fetch the latest videos from your subscriptions." />
            </View>
          }
          ListFooterComponent={
            videos.length === 0 ? undefined : (
              <View style={s.footer}>
                {loadingMore ? (
                  <View style={s.row}>
                    <ActivityIndicator size="small" color={colors.mutedForeground} />
                    <Text style={s.footerText}>Loading more videos…</Text>
                  </View>
                ) : !hasMoreRef.current ? <Text style={s.footerText}>All videos loaded</Text> : null}
              </View>
            )
          }
          renderItem={({ item }) => (
            <SwipeToDismiss onDismiss={() => dismiss(item.videoId)}>
              <VideoCard video={item} />
            </SwipeToDismiss>
          )}
        />
      )}
    </View>
  )
}

function VideoSkeleton() {
  const s = useStyles()
  return (
    <View style={s.skeleton}>
      <Skeleton style={s.skeletonThumb} />
      <View style={s.skeletonMeta}>
        <Skeleton style={s.skeletonAvatar} />
        <View style={s.skeletonLines}>
          <Skeleton style={s.skeletonLine} />
          <Skeleton style={[s.skeletonLine, { width: '75%' }]} />
          <Skeleton style={[s.skeletonLine, { width: '50%', height: 12 }]} />
        </View>
      </View>
    </View>
  )
}

const useStyles = makeStyles((c) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  list: { paddingHorizontal: 16, paddingVertical: 16, gap: 24 },
  listHeader: { gap: 12, marginBottom: -12 },
  hint: { color: c.mutedForeground, fontSize: 12, textAlign: 'center' },
  emptyWrap: { paddingVertical: 64 },
  footer: { minHeight: 40, alignItems: 'center', justifyContent: 'center', marginTop: 8, paddingBottom: 32 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerText: { color: c.mutedForeground, fontSize: 14 },
  skeleton: { gap: 8 },
  skeletonThumb: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.xl },
  skeletonMeta: { flexDirection: 'row', gap: 8, paddingTop: 4 },
  skeletonAvatar: { width: 32, height: 32, borderRadius: 16 },
  skeletonLines: { flex: 1, gap: 6 },
  skeletonLine: { height: 14, width: '100%' },
}))
