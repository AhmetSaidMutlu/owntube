import { useCallback, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router, useFocusEffect } from 'expo-router'
import type { YoutubeStatusResponse } from '@shared/types'
import { api, syncErrorMessage } from '@/lib/api'
import { useYoutubeConnect } from '@/lib/use-youtube-connect'
import { Banner, Button, Card, Loading } from '@/components/ui'
import { radii, theme } from '@/lib/theme'

// Web'deki components/dashboard-content.tsx karşılığı.
export default function DashboardScreen() {
  const [status, setStatus] = useState<YoutubeStatusResponse | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadStatus = useCallback(async () => {
    try {
      setStatus(await api.youtubeStatus())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load status')
    }
  }, [])

  useFocusEffect(useCallback(() => { loadStatus() }, [loadStatus]))

  const syncVideos = useCallback(async () => {
    setSyncing(true)
    setError('')
    setSuccess('')
    try {
      const data = await api.sync()
      setSuccess(`Synced ${data.subscriptions_count || 0} subscriptions and ${data.videos_synced || 0} new videos!`)
      await loadStatus()
    } catch (err) {
      setError(syncErrorMessage(err))
    } finally {
      setSyncing(false)
    }
  }, [loadStatus])

  const youtube = useYoutubeConnect(useCallback(() => {
    setSuccess('YouTube account connected successfully!')
    loadStatus().then(syncVideos)
  }, [loadStatus, syncVideos]))

  async function onRefresh() {
    setRefreshing(true)
    await loadStatus()
    setRefreshing(false)
  }

  if (!status) return error ? <SafeAreaView style={styles.screen}><View style={styles.content}><Banner message={error} /></View></SafeAreaView> : <Loading />

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}>
        <Banner message={error || youtube.error} />
        <Banner message={success} tone="success" />

        {!status.connected ? (
          <Card style={styles.connectCard}>
            <Text style={styles.connectTitle}>Connect Your YouTube</Text>
            <Text style={styles.muted}>Connect your YouTube account to access your subscriptions and videos</Text>
            <Button label="Connect YouTube" icon="logo-youtube" onPress={youtube.connect} loading={youtube.connecting} />
          </Card>
        ) : (
          <>
            <View>
              <Text style={styles.title}>Dashboard</Text>
              <Text style={styles.muted}>Welcome to your private video feed</Text>
            </View>
            <Button label={syncing ? 'Syncing...' : 'Sync Now'} icon="refresh" variant="secondary" onPress={syncVideos} loading={syncing} />

            <View style={styles.stats}>
              <StatCard icon="play" label="Videos" value={status.video_count} caption="videos in your feed" onPress={() => router.navigate('/videos')} />
              <StatCard icon="people" label="Subscriptions" value={status.subscription_count} caption="channels followed" onPress={() => router.navigate('/subscriptions')} />
            </View>

            {status.video_count === 0 && status.subscription_count === 0 ? (
              <Card style={styles.dashed}>
                <Text style={styles.cardTitle}>Ready to Sync</Text>
                <Text style={styles.muted}>Your YouTube account is connected. Tap the button below to fetch your subscriptions and videos.</Text>
                <Button label={syncing ? 'Syncing...' : 'Sync My YouTube'} icon="refresh" onPress={syncVideos} loading={syncing} />
              </Card>
            ) : (
              <Card>
                <View style={styles.row}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                  <Text style={styles.cardTitle}>YouTube Connected</Text>
                </View>
                <Text style={styles.muted}>Your YouTube account is connected and syncing.{'\n'}Pull down on the Videos tab to refresh your feed.</Text>
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function StatCard({ icon, label, value, caption, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: number; caption: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.stat, pressed && { opacity: 0.8 }]}>
      <View style={styles.statHeader}>
        <Text style={styles.statLabel}>{label}</Text>
        <Ionicons name={icon} size={18} color={theme.muted} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statCaption}>{caption}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 16, gap: 16 },
  title: { color: theme.text, fontSize: 26, fontWeight: '800' },
  muted: { color: theme.muted, fontSize: 14, lineHeight: 20 },
  connectCard: { alignItems: 'stretch', marginTop: 40 },
  connectTitle: { color: theme.text, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  stats: { flexDirection: 'row', gap: 12 },
  stat: { flex: 1, backgroundColor: theme.surface, borderRadius: radii.card, padding: 16 },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLabel: { color: theme.text, fontSize: 15, fontWeight: '700' },
  statValue: { color: theme.text, fontSize: 30, fontWeight: '800', marginTop: 10 },
  statCaption: { color: theme.muted, fontSize: 12 },
  dashed: { borderWidth: 2, borderStyle: 'dashed', borderColor: theme.border, backgroundColor: 'transparent' },
  cardTitle: { color: theme.text, fontSize: 17, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
})
