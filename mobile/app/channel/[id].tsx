import { useEffect, useState } from 'react'
import { FlatList, StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import type { ChannelResponse } from '@shared/types'
import { api } from '@/lib/api'
import { onVideoWatched } from '@/lib/watched-store'
import { VideoCard, type FeedVideo } from '@/components/VideoCard'
import { Avatar, Banner, EmptyState, Loading } from '@/components/ui'
import { theme } from '@/lib/theme'

// Web'deki app/channel/[id]/page.tsx karşılığı.
export default function ChannelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [channel, setChannel] = useState<ChannelResponse['subscription']>(null)
  const [videos, setVideos] = useState<FeedVideo[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    api.channel(id)
      .then(({ subscription, videos: rows }) => {
        setChannel(subscription)
        setVideos(rows.map((v) => ({ ...v, channelThumbnail: subscription?.channelThumbnail })))
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load channel')
        setVideos([])
      })
  }, [id])

  useEffect(() => onVideoWatched((videoId) => {
    setVideos((current) => current?.map((v) => (v.videoId === videoId ? { ...v, isWatched: true } : v)) ?? null)
  }), [])

  if (!videos) return <Loading />

  const title = channel?.channelTitle ?? videos[0]?.channelTitle ?? 'Channel'

  return (
    <FlatList
      style={styles.screen}
      data={videos}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.header}>
          <Avatar uri={channel?.channelThumbnail} name={title} size={72} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.meta}>{videos.length} videos in your feed</Text>
          <Banner message={error} />
        </View>
      }
      ListEmptyComponent={error ? undefined :<EmptyState icon="videocam-outline" title="No videos" description="No videos from this channel have been synced yet." />}
      renderItem={({ item }) => <VideoCard video={item} showChannel={false} />}
    />
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  list: { padding: 16, gap: 22 },
  header: { alignItems: 'center', gap: 6, paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border, marginBottom: 4 },
  title: { color: theme.text, fontSize: 22, fontWeight: '800', marginTop: 8, textAlign: 'center' },
  meta: { color: theme.muted, fontSize: 13, marginBottom: 12 },
})
