import { useCallback, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { Eye, EyeOff, RefreshCw, Users } from 'lucide-react-native'
import type { Subscription } from '@shared/types'
import { api, syncErrorMessage } from '@/lib/api'
import { Alert, Avatar, Button, Empty, Skeleton } from '@/components/ui'
import { makeStyles, useTheme } from '@/lib/theme'

const COLUMNS = 4

// Web'deki app/(protected)/subscriptions/page.tsx karşılığı: kanal ızgarası; avatara dokununca
// kanal sayfası, köşedeki göz düğmesiyle kanal akışa dahil edilir / gizlenir.
export default function SubscriptionsScreen() {
  const { colors } = useTheme()
  const s = useStyles()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const { subscriptions: data } = await api.subscriptions()
      setSubscriptions(data)
      setError('')
    } catch {
      setError('Failed to load subscriptions. Please try again.')
    }
  }, [])

  // Kanal sayfasında takipten çıkılan kanal listeden düşsün diye her odaklanmada yenilenir.
  useFocusEffect(useCallback(() => { load().finally(() => setLoading(false)) }, [load]))

  async function toggle(channelId: string, isActive: boolean) {
    setTogglingId(channelId)
    try {
      await api.setSubscriptionActive(channelId, isActive)
      setSubscriptions((subs) => subs.map((sub) => (sub.channelId === channelId ? { ...sub, isActive } : sub)))
    } catch {
      setError('Failed to update subscription')
    } finally {
      setTogglingId(null)
    }
  }

  async function sync() {
    setSyncing(true)
    setError('')
    try {
      await api.sync()
      await load()
    } catch (err) {
      setError(syncErrorMessage(err))
    } finally {
      setSyncing(false)
    }
  }

  async function onRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const activeCount = subscriptions.filter((sub) => sub.isActive).length

  const header = (
    <View style={s.headerWrap}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>Subscriptions</Text>
          <Text style={s.subtitle}>{activeCount} of {subscriptions.length} channels active</Text>
        </View>
        <Button label={syncing ? 'Syncing...' : 'Sync'} icon={RefreshCw} iconSpin={syncing} variant="outline" size="sm" onPress={sync} disabled={syncing} />
      </View>
      <Alert message={error} />
    </View>
  )

  if (loading) {
    return (
      <View style={s.screen}>
        <View style={s.content}>
          {header}
          <View style={s.skeletonGrid}>
            {Array.from({ length: 16 }).map((_, i) => (
              <View key={i} style={s.skeletonCell}>
                <Skeleton style={s.skeletonAvatar} />
                <Skeleton style={s.skeletonName} />
              </View>
            ))}
          </View>
        </View>
      </View>
    )
  }

  return (
    <FlatList
      style={s.screen}
      data={subscriptions}
      keyExtractor={(item) => item.id}
      numColumns={COLUMNS}
      contentContainerStyle={s.content}
      columnWrapperStyle={s.column}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.mutedForeground} colors={[colors.foreground]} progressBackgroundColor={colors.card} />}
      ListHeaderComponent={header}
      ListEmptyComponent={<Empty icon={Users} title="No subscriptions yet" description="Tap Sync to import your YouTube subscriptions." />}
      renderItem={({ item }) => {
        const Toggle = item.isActive ? EyeOff : Eye
        return (
          <View style={[s.cell, !item.isActive && s.inactive]}>
            <View>
              <Pressable onPress={() => router.push(`/channel/${item.channelId}`)} accessibilityLabel={`Open ${item.channelTitle}`}>
                <Avatar uri={item.channelThumbnail} name={item.channelTitle} size={48} />
              </Pressable>
              <Pressable
                onPress={() => toggle(item.channelId, !item.isActive)}
                disabled={togglingId === item.channelId}
                hitSlop={8}
                style={s.badge}
                accessibilityLabel={item.isActive ? 'Hide channel' : 'Show channel'}
              >
                {togglingId === item.channelId ? <ActivityIndicator size={10} color={colors.mutedForeground} /> : <Toggle size={10} color={colors.mutedForeground} />}
              </Pressable>
            </View>
            <Pressable onPress={() => router.push(`/channel/${item.channelId}`)} style={s.nameWrap}>
              <Text numberOfLines={2} style={s.name}>{item.channelTitle}</Text>
            </Pressable>
          </View>
        )
      }}
    />
  )
}

const useStyles = makeStyles((c) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  content: { paddingHorizontal: 16, paddingVertical: 24, gap: 16 },
  headerWrap: { gap: 16, marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: c.foreground, fontSize: 20, fontWeight: '600' },
  subtitle: { color: c.mutedForeground, fontSize: 12, marginTop: 2 },
  column: { gap: 12 },
  cell: { flex: 1 / COLUMNS, alignItems: 'center', gap: 6 },
  inactive: { opacity: 0.4 },
  badge: { position: 'absolute', right: -2, bottom: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: c.background, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
  nameWrap: { width: '100%' },
  name: { color: c.mutedForeground, fontSize: 10, lineHeight: 12, textAlign: 'center' },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8 },
  skeletonCell: { width: '33.33%', alignItems: 'center', gap: 6 },
  skeletonAvatar: { width: 48, height: 48, borderRadius: 24 },
  skeletonName: { width: 56, height: 10 },
}))
