import { useCallback, useEffect, useState } from 'react'
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, UserMinus } from 'lucide-react-native'
import type { ChannelResponse } from '@shared/types'
import { api, ApiError } from '@/lib/api'
import { onVideoWatched } from '@/lib/watched-store'
import { useYoutubeConnect } from '@/lib/use-youtube-connect'
import { VideoCard, type FeedVideo } from '@/components/VideoCard'
import { Alert, Avatar, Button, Skeleton } from '@/components/ui'
import { makeStyles, radius, useTheme } from '@/lib/theme'

type UnsubscribeError = { message: string; reauth?: boolean }

// Web'deki app/channel/[id]/page.tsx karşılığı: solda kanal bilgisi, sağda "Takibi Bırak".
export default function ChannelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { colors } = useTheme()
  const s = useStyles()
  const insets = useSafeAreaInsets()
  const [channel, setChannel] = useState<ChannelResponse['subscription']>(null)
  const [videos, setVideos] = useState<FeedVideo[] | null>(null)
  const [error, setError] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [unsubscribing, setUnsubscribing] = useState(false)
  const [unsubscribeError, setUnsubscribeError] = useState<UnsubscribeError | null>(null)

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

  const youtube = useYoutubeConnect(useCallback(() => setUnsubscribeError(null), []))

  async function handleUnsubscribe() {
    if (!id) return
    setUnsubscribing(true)
    setUnsubscribeError(null)
    try {
      await api.unsubscribeChannel(id)
      setConfirmOpen(false)
      router.navigate('/subscriptions')
    } catch (err) {
      const code = err instanceof ApiError ? err.code : undefined
      if (code === 'reauth_required') {
        setUnsubscribeError({ message: 'YouTube hesabından takipten çıkmak için izin gerekiyor. Lütfen YouTube bağlantısını yenileyin.', reauth: true })
      } else if (code === 'quota_exceeded') {
        setUnsubscribeError({ message: 'YouTube API kotası doldu. Yarın tekrar deneyin.' })
      } else {
        setUnsubscribeError({ message: 'Takipten çıkılamadı. Lütfen tekrar deneyin.' })
      }
    } finally {
      setUnsubscribing(false)
    }
  }

  function closeDialog() {
    if (unsubscribing) return
    setConfirmOpen(false)
    setUnsubscribeError(null)
  }

  const title = channel?.channelTitle ?? videos?.[0]?.channelTitle ?? ''

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      {/* Kanal başlığı */}
      <View style={s.headerBar}>
        <View style={s.header}>
          <View style={s.channelInfo}>
            <Pressable onPress={() => router.back()} style={s.back} hitSlop={6} accessibilityLabel="Go back">
              <ArrowLeft size={20} color={colors.foreground} />
            </Pressable>
            {videos ? (
              <>
                <Avatar uri={channel?.channelThumbnail} name={title} size={48} />
                <View style={s.flexShrink}>
                  <Text numberOfLines={1} style={s.title}>{title}</Text>
                  <Text style={s.meta}>{videos.length} videos</Text>
                </View>
              </>
            ) : (
              <View style={s.row}>
                <Skeleton style={s.avatarSkeleton} />
                <View style={s.lines}>
                  <Skeleton style={{ height: 16, width: 128 }} />
                  <Skeleton style={{ height: 12, width: 64 }} />
                </View>
              </View>
            )}
          </View>
          <Button label="Takibi Bırak" icon={UserMinus} variant="destructive" onPress={() => setConfirmOpen(true)} disabled={!videos} />
        </View>
      </View>

      {!videos ? (
        <ScrollView contentContainerStyle={s.list} scrollEnabled={false}>
          {Array.from({ length: 3 }).map((_, i) => (
            <View key={i} style={s.gap}>
              <Skeleton style={s.thumbSkeleton} />
              <Skeleton style={{ height: 14, width: '80%' }} />
            </View>
          ))}
        </ScrollView>
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[s.list, { paddingBottom: 16 + insets.bottom }]}
          ListHeaderComponent={error ? <Alert message={error} /> : null}
          ListEmptyComponent={error ? null : <Text style={s.empty}>No videos found for this channel. Try syncing first.</Text>}
          renderItem={({ item }) => <VideoCard video={item} />}
        />
      )}

      {/* Web'deki AlertDialog karşılığı */}
      <Modal visible={confirmOpen} transparent animationType="fade" onRequestClose={closeDialog} statusBarTranslucent>
        <Pressable style={s.overlay} onPress={closeDialog}>
          <Pressable style={s.dialog} onPress={() => {}}>
            <View style={s.dialogHeader}>
              <Text style={s.dialogTitle}>{title || 'Bu kanalı'} takipten çıkarılsın mı?</Text>
              <Text style={s.dialogText}>
                Kanal YouTube hesabınızda takipten çıkarılacak ve bu kanala ait {videos?.length ?? 0} video veritabanından kalıcı olarak silinecek. Bu işlem geri alınamaz.
              </Text>
            </View>
            {unsubscribeError ? (
              <View style={s.dialogError}>
                <Text style={s.dialogErrorText}>{unsubscribeError.message}</Text>
                {unsubscribeError.reauth ? (
                  <Pressable onPress={youtube.connect} disabled={youtube.connecting} hitSlop={6}>
                    <Text style={[s.dialogErrorText, s.link]}>{youtube.connecting ? 'Bağlanıyor…' : 'YouTube bağlantısını yenile'}</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
            <View style={s.dialogFooter}>
              <Button label="Takibi Bırak" variant="destructive" onPress={handleUnsubscribe} loading={unsubscribing} />
              <Button label="Vazgeç" variant="outline" onPress={closeDialog} disabled={unsubscribing} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

const useStyles = makeStyles((c) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  headerBar: { borderBottomWidth: 1, borderBottomColor: c.border },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 16, paddingVertical: 16 },
  channelInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 },
  back: { padding: 8, borderRadius: radius.full },
  flexShrink: { flexShrink: 1, minWidth: 0 },
  title: { color: c.foreground, fontSize: 16, fontWeight: '600' },
  meta: { color: c.mutedForeground, fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lines: { gap: 6 },
  avatarSkeleton: { width: 48, height: 48, borderRadius: 24 },
  list: { paddingHorizontal: 16, paddingVertical: 20, gap: 24 },
  gap: { gap: 8 },
  thumbSkeleton: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.xl },
  empty: { color: c.mutedForeground, fontSize: 14, textAlign: 'center', paddingVertical: 64 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 },
  dialog: { backgroundColor: c.background, borderColor: c.border, borderWidth: 1, borderRadius: radius.lg, padding: 24, gap: 16 },
  dialogHeader: { gap: 8 },
  dialogTitle: { color: c.foreground, fontSize: 18, fontWeight: '600', textAlign: 'center' },
  dialogText: { color: c.mutedForeground, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  dialogError: { borderWidth: 1, borderColor: c.destructiveText, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: c.dark ? 'rgba(255,100,103,0.1)' : 'rgba(231,0,11,0.06)', gap: 4 },
  dialogErrorText: { color: c.destructiveText, fontSize: 14, lineHeight: 20 },
  link: { fontWeight: '500', textDecorationLine: 'underline' },
  dialogFooter: { gap: 8 },
}))
