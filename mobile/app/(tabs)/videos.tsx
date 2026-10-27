import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { smartSort } from '@shared/feed'
import { api, syncErrorMessage } from '@/lib/api'
import { dismissedVideoIds, onVideoWatched } from '@/lib/watched-store'
import { VideoCard, type FeedVideo } from '@/components/VideoCard'
import { SwipeToDismiss } from '@/components/SwipeToDismiss'
import { Banner, EmptyState, Loading } from '@/components/ui'
import { radii, theme } from '@/lib/theme'

const PAGE_SIZE = 20

// Web'deki app/(protected)/videos/page.tsx karşılığı: akıllı sıralama, sonsuz kaydırma,
// aşağı çekerek yenileme, kaydırarak gizleme.
export default function VideosScreen() {
  const [videos, setVideos] = useState<FeedVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [syncing, setSyncing] = useState(false)
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
    for (const s of subscriptions) if (s.channelThumbnail) map[s.channelId] = s.channelThumbnail
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

  async function onSync() {
    setSyncing(true)
    setError('')
    try {
      await api.sync()
      await reload()
    } catch (err) {
      setError(syncErrorMessage(err))
    } finally {
      setSyncing(false)
    }
  }

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
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Videos</Text>
        <Pressable onPress={onSync} disabled={syncing} style={({ pressed }) => [styles.sync, (pressed || syncing) && { opacity: 0.6 }]}>
          {syncing ? <ActivityIndicator size="small" color={theme.text} /> : <Ionicons name="refresh" size={16} color={theme.text} />}
          <Text style={styles.syncText}>{syncing ? 'Syncing…' : 'Sync'}</Text>
        </Pressable>
      </View>

      {loading ? <Loading /> : (
        <FlatList
          data={videos}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.6}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Banner message={error} />
              {videos.length > 0 ? <Text style={styles.hint}>💡 Swipe a video left or right to hide it</Text> : null}
            </View>
          }
          ListEmptyComponent={<EmptyState icon="videocam-outline" title="No videos yet" description="Press Sync to fetch the latest videos from your subscriptions." />}
          ListFooterComponent={
            videos.length === 0 ? undefined : (
              <View style={styles.footer}>
                {loadingMore ? <ActivityIndicator color={theme.muted} /> : !hasMoreRef.current ? <Text style={styles.hint}>All videos loaded</Text> : null}
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
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
  title: { color: theme.text, fontSize: 22, fontWeight: '800' },
  sync: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.surfaceRaised, borderRadius: radii.control, paddingHorizontal: 12, paddingVertical: 8 },
  syncText: { color: theme.text, fontSize: 13, fontWeight: '600' },
  list: { padding: 16, gap: 22 },
  listHeader: { gap: 12 },
  hint: { color: theme.muted, fontSize: 12, textAlign: 'center' },
  footer: { minHeight: 40, alignItems: 'center', justifyContent: 'center', paddingBottom: 16 },
})
