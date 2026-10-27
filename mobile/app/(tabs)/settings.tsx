import { useCallback, useState } from 'react'
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from 'expo-router'
import { api } from '@/lib/api'
import { authClient } from '@/lib/auth-client'
import { API_URL } from '@/lib/config'
import { useYoutubeConnect } from '@/lib/use-youtube-connect'
import { Avatar, Banner, Button, Card } from '@/components/ui'
import { theme } from '@/lib/theme'

// Web'deki app/(protected)/settings/page.tsx karşılığı.
export default function SettingsScreen() {
  const { data: session } = authClient.useSession()
  const [connected, setConnected] = useState<boolean | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [disconnecting, setDisconnecting] = useState(false)

  const loadStatus = useCallback(async () => {
    try {
      setConnected((await api.youtubeStatus()).connected)
    } catch {
      setConnected(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { loadStatus() }, [loadStatus]))

  const youtube = useYoutubeConnect(useCallback(() => {
    setSuccess('YouTube account connected successfully!')
    setConnected(true)
  }, []))

  async function disconnect() {
    setDisconnecting(true)
    setError('')
    setSuccess('')
    try {
      await api.youtubeDisconnect()
      setConnected(false)
    } catch {
      setError('Failed to disconnect YouTube')
    } finally {
      setDisconnecting(false)
    }
  }

  const user = session?.user

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.muted}>Manage your account and preferences</Text>
        </View>

        <Banner message={error || youtube.error} />
        <Banner message={success} tone="success" />

        <Card>
          <Text style={styles.cardTitle}>Account</Text>
          <View style={styles.row}>
            <Avatar uri={user?.image} name={user?.name || user?.email} size={52} />
            <View style={styles.flex}>
              <Text style={styles.name}>{user?.name || 'User'}</Text>
              <Text style={styles.muted}>{user?.email}</Text>
            </View>
          </View>
          <Button label="Sign Out" icon="log-out-outline" variant="danger" onPress={() => authClient.signOut()} />
        </Card>

        <Card>
          <View style={styles.row}>
            <Ionicons name="logo-youtube" size={22} color="#ff0000" />
            <Text style={styles.cardTitle}>YouTube Connection</Text>
          </View>
          {connected ? (
            <>
              <View style={styles.row}>
                <Ionicons name="checkmark-circle" size={18} color={theme.success} />
                <Text style={styles.body}>Your YouTube account is connected.</Text>
              </View>
              <Button label="Disconnect YouTube" variant="secondary" onPress={disconnect} loading={disconnecting} />
            </>
          ) : (
            <>
              <Text style={styles.body}>Connect your YouTube account to sync your subscriptions and videos.</Text>
              <Button label="Connect YouTube" icon="logo-youtube" onPress={youtube.connect} loading={youtube.connecting} disabled={connected === null} />
            </>
          )}
        </Card>

        <Card style={styles.quota}>
          <View style={styles.row}>
            <Ionicons name="warning-outline" size={20} color={theme.warning} />
            <Text style={[styles.cardTitle, { color: theme.warning }]}>YouTube API Quota</Text>
          </View>
          <Text style={styles.body}>
            The YouTube Data API allows 10,000 units per day. Each sync uses about 1 unit per 50 subscriptions plus 1 unit per channel. Quotas reset at midnight Pacific Time.
          </Text>
          <Button label="Open Google Cloud Console" icon="open-outline" variant="secondary" onPress={() => Linking.openURL('https://console.cloud.google.com/apis/dashboard')} />
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Server</Text>
          <Text style={styles.mono}>{API_URL}</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 16, gap: 16 },
  title: { color: theme.text, fontSize: 26, fontWeight: '800' },
  muted: { color: theme.muted, fontSize: 13 },
  cardTitle: { color: theme.text, fontSize: 17, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flex: { flex: 1 },
  name: { color: theme.text, fontSize: 16, fontWeight: '600' },
  body: { color: theme.muted, fontSize: 14, lineHeight: 20, flexShrink: 1 },
  quota: { borderWidth: 1, borderColor: '#5c4a00' },
  mono: { color: theme.muted, fontFamily: 'monospace', fontSize: 13 },
})
