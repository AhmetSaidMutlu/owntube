import { useCallback, useEffect, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { CircleCheck, Play, RefreshCw, Settings, Users, type LucideIcon } from 'lucide-react-native'
import type { YoutubeStatusResponse } from '@shared/types'
import { api, syncErrorMessage } from '@/lib/api'
import { useYoutubeConnect } from '@/lib/use-youtube-connect'
import { onVideosSynced } from '@/lib/watched-store'
import { Alert, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, LoadingText } from '@/components/ui'
import { makeStyles, useTheme } from '@/lib/theme'

// Web'deki components/dashboard-content.tsx karşılığı.
export default function DashboardScreen() {
  const { colors } = useTheme()
  const s = useStyles()
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
  useEffect(() => onVideosSynced(() => { loadStatus() }), [loadStatus])

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

  if (!status && !error) return <LoadingText />

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.mutedForeground} colors={[colors.foreground]} progressBackgroundColor={colors.card} />}
    >
      <Alert message={error || youtube.error} />
      <Alert message={success} variant="success" />

      {!status ? null : !status.connected ? (
        <Card>
          <CardHeader style={s.center}>
            <CardTitle style={s.connectTitle}>Connect Your YouTube</CardTitle>
            <CardDescription style={s.centerText}>Connect your YouTube account to access your subscriptions and videos</CardDescription>
          </CardHeader>
          <CardContent style={s.center}>
            <Button label="Connect YouTube" icon={Play} size="lg" onPress={youtube.connect} loading={youtube.connecting} />
          </CardContent>
        </Card>
      ) : (
        <>
          <View style={s.heading}>
            <Text style={s.title}>Dashboard</Text>
            <Text style={s.muted}>Welcome to your private video feed</Text>
          </View>
          <Button label={syncing ? 'Syncing...' : 'Sync Now'} icon={RefreshCw} iconSpin={syncing} variant="outline" onPress={syncVideos} disabled={syncing} />

          <View style={s.grid}>
            <StatCard title="Videos" icon={Play} value={status.video_count} caption="videos in your feed" onPress={() => router.navigate('/videos')} />
            <StatCard title="Subscriptions" icon={Users} value={status.subscription_count} caption="channels followed" onPress={() => router.navigate('/subscriptions')} />
            <StatCard title="Settings" icon={Settings} caption="Manage your account and preferences" onPress={() => router.navigate('/settings')} />
          </View>

          {status.video_count === 0 && status.subscription_count === 0 ? (
            <Card style={s.dashed}>
              <CardHeader style={s.center}>
                <CardTitle style={s.cardTitle}>Ready to Sync</CardTitle>
                <CardDescription style={s.centerText}>Your YouTube account is connected. Tap the button below to fetch your subscriptions and videos.</CardDescription>
              </CardHeader>
              <CardContent style={s.center}>
                <Button label={syncing ? 'Syncing...' : 'Sync My YouTube'} icon={RefreshCw} iconSpin={syncing} size="lg" onPress={syncVideos} disabled={syncing} />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader style={s.row}>
                <CircleCheck size={20} color={colors.success} />
                <CardTitle style={s.cardTitle}>YouTube Connected</CardTitle>
              </CardHeader>
              <CardContent style={s.gap}>
                <Text style={s.small}>Your YouTube account is connected and syncing.</Text>
                <Text style={s.small}>Pull down on the Videos page to refresh your feed.</Text>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </ScrollView>
  )
}

function StatCard({ title, icon: Icon, value, caption, onPress }: { title: string; icon: LucideIcon; value?: number; caption: string; onPress: () => void }) {
  const { colors } = useTheme()
  const s = useStyles()
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.7 }}>
      <Card style={s.statCard}>
        <CardHeader style={s.statHeader}>
          <CardTitle style={s.cardTitle}>{title}</CardTitle>
          <Icon size={20} color={colors.mutedForeground} />
        </CardHeader>
        <CardContent>
          {value !== undefined ? <Text style={s.statValue}>{value}</Text> : null}
          <Text style={s.small}>{caption}</Text>
        </CardContent>
      </Card>
    </Pressable>
  )
}

const useStyles = makeStyles((c) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  content: { paddingHorizontal: 16, paddingVertical: 24, gap: 16 },
  center: { alignItems: 'center' },
  centerText: { textAlign: 'center' },
  connectTitle: { fontSize: 24 },
  heading: { gap: 2 },
  title: { color: c.foreground, fontSize: 24, fontWeight: '700' },
  muted: { color: c.mutedForeground, fontSize: 14 },
  grid: { gap: 12 },
  statCard: { gap: 0 },
  statHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8 },
  statValue: { color: c.foreground, fontSize: 30, fontWeight: '700' },
  cardTitle: { fontSize: 18 },
  small: { color: c.mutedForeground, fontSize: 14, lineHeight: 20 },
  dashed: { borderStyle: 'dashed', borderWidth: 2 },
  row: { flexDirection: 'row', alignItems: 'center' },
  gap: { gap: 8 },
}))
