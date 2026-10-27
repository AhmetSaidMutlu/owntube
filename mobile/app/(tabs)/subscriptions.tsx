import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Switch, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import type { Subscription } from '@shared/types'
import { api, syncErrorMessage } from '@/lib/api'
import { Avatar, Banner, Button, EmptyState, Loading } from '@/components/ui'
import { radii, theme } from '@/lib/theme'

// Web'deki app/(protected)/subscriptions/page.tsx karşılığı: kanalları akışa dahil et / hariç tut.
export default function SubscriptionsScreen() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const { subscriptions: data } = await api.subscriptions()
      setSubscriptions([...data].sort((a, b) => (a.channelTitle ?? '').localeCompare(b.channelTitle ?? '')))
      setError('')
    } catch {
      setError('Failed to load subscriptions. Please try again.')
    }
  }, [])

  useEffect(() => { load().finally(() => setLoading(false)) }, [load])

  async function toggle(channelId: string, isActive: boolean) {
    setTogglingId(channelId)
    try {
      await api.setSubscriptionActive(channelId, isActive)
      setSubscriptions((subs) => subs.map((s) => (s.channelId === channelId ? { ...s, isActive } : s)))
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

  const activeCount = subscriptions.filter((s) => s.isActive).length

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Subscriptions</Text>
          {subscriptions.length > 0 ? <Text style={styles.muted}>{activeCount} of {subscriptions.length} channels in your feed</Text> : null}
        </View>
        <Button label="Sync" icon="refresh" variant="secondary" onPress={sync} loading={syncing} style={styles.syncButton} />
      </View>

      {loading ? <Loading /> : (
        <FlatList
          data={subscriptions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
          ListHeaderComponent={<Banner message={error} />}
          ListEmptyComponent={<EmptyState icon="people-outline" title="No subscriptions" description="Sync your YouTube account to load the channels you follow." />}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/channel/${item.channelId}`)} style={({ pressed }) => [styles.row, !item.isActive && styles.inactive, pressed && { opacity: 0.8 }]}>
              <Avatar uri={item.channelThumbnail} name={item.channelTitle} size={44} />
              <View style={styles.rowText}>
                <Text numberOfLines={1} style={styles.channel}>{item.channelTitle}</Text>
                {!item.isActive ? (
                  <View style={styles.hidden}>
                    <Ionicons name="eye-off-outline" size={12} color={theme.muted} />
                    <Text style={styles.muted}>Hidden from feed</Text>
                  </View>
                ) : null}
              </View>
              {togglingId === item.channelId ? <ActivityIndicator color={theme.muted} /> : (
                <Switch
                  value={item.isActive}
                  onValueChange={(value) => toggle(item.channelId, value)}
                  trackColor={{ false: theme.surfaceRaised, true: theme.accent }}
                  thumbColor="#fff"
                />
              )}
            </Pressable>
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
  muted: { color: theme.muted, fontSize: 12 },
  syncButton: { paddingVertical: 8, paddingHorizontal: 12 },
  list: { padding: 16, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radii.card, backgroundColor: theme.surface },
  inactive: { opacity: 0.6 },
  rowText: { flex: 1, gap: 3 },
  channel: { color: theme.text, fontSize: 15, fontWeight: '600' },
  hidden: { flexDirection: 'row', alignItems: 'center', gap: 4 },
})
