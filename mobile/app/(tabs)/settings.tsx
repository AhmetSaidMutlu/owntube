import { useCallback, useState } from 'react'
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { CircleCheck, ExternalLink, LogOut, TriangleAlert } from 'lucide-react-native'
import { api } from '@/lib/api'
import { authClient } from '@/lib/auth-client'
import { useYoutubeConnect } from '@/lib/use-youtube-connect'
import { Alert, Avatar, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { makeStyles, radius, useTheme } from '@/lib/theme'

// Web'deki app/(protected)/settings/page.tsx karşılığı.
export default function SettingsScreen() {
  const { colors } = useTheme()
  const s = useStyles()
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
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <View>
        <Text style={s.title}>Settings</Text>
        <Text style={s.muted}>Manage your account and preferences</Text>
      </View>

      <Alert message={error || youtube.error} />
      <Alert message={success} variant="success" />

      {/* Hesap */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent style={s.stack}>
          {user?.image ? (
            <View style={s.row}>
              <Avatar uri={user.image} name={user.name} size={64} />
              <View style={s.flex}>
                <Text style={s.name}>{user.name || 'User'}</Text>
                <Text style={s.mutedSmall}>{user.email}</Text>
              </View>
            </View>
          ) : (
            <View>
              <Text style={s.label}>Email</Text>
              <Text style={[s.mutedSmall, { marginTop: 4 }]}>{user?.email}</Text>
            </View>
          )}
          <Button label="Sign Out" icon={LogOut} variant="destructive" onPress={() => authClient.signOut()} style={s.selfStart} />
        </CardContent>
      </Card>

      {/* YouTube API kotası */}
      <Card style={{ backgroundColor: colors.amberBg, borderColor: colors.amberBorder }}>
        <CardHeader>
          <View style={s.row}>
            <TriangleAlert size={20} color={colors.amberTitle} />
            <CardTitle style={{ color: colors.amberTitle }}>YouTube API Quota</CardTitle>
          </View>
          <CardDescription style={{ color: colors.amberText }}>Important information about API limits</CardDescription>
        </CardHeader>
        <CardContent style={s.stack}>
          <View>
            <Text style={[s.amberStrong, { color: colors.amberText }]}>Current Limits:</Text>
            <Bullet color={colors.amberText}>Free tier: <Text style={s.bold}>10,000 quota units</Text> per day</Bullet>
            <Bullet color={colors.amberText}>Subscriptions: ~1 unit per subscription page (50 channels)</Bullet>
            <Bullet color={colors.amberText}>Videos: ~1 unit per channel</Bullet>
            <Bullet color={colors.amberText}>Unsubscribe: ~51 units per channel</Bullet>
          </View>
          <View style={[s.amberInner, { backgroundColor: colors.amberInner }]}>
            <Text style={[s.amberStrong, { color: colors.amberText }]}>If you hit the quota limit:</Text>
            <Bullet color={colors.amberText} marker="1.">The sync will fail with a &quot;quotaExceeded&quot; error</Bullet>
            <Bullet color={colors.amberText} marker="2.">Wait until the next day for quotas to reset (Pacific midnight)</Bullet>
            <Bullet color={colors.amberText} marker="3.">Alternatively, request quota increase from Google API Console</Bullet>
          </View>
          <Button
            label="Go to Google Cloud Console"
            icon={ExternalLink}
            variant="outline"
            onPress={() => Linking.openURL('https://console.cloud.google.com/apis/dashboard')}
            style={{ borderColor: colors.amberButtonBorder, backgroundColor: 'transparent' }}
            textStyle={{ color: colors.amberText }}
          />
        </CardContent>
      </Card>

      {/* YouTube bağlantısı */}
      <Card>
        <CardHeader>
          <View style={s.row}>
            <Ionicons name="logo-youtube" size={20} color={colors.foreground} />
            <CardTitle>YouTube Integration</CardTitle>
          </View>
          <CardDescription>Manage your YouTube account connection</CardDescription>
        </CardHeader>
        <CardContent style={s.stack}>
          {connected === null ? (
            <Text style={s.mutedSmall}>Loading...</Text>
          ) : connected ? (
            <>
              <View style={[s.connected, { backgroundColor: colors.successBg }]}>
                <CircleCheck size={20} color={colors.successText} />
                <Text style={[s.connectedText, { color: colors.successText }]}>YouTube connected</Text>
              </View>
              <Button label="Disconnect YouTube" variant="outline" onPress={disconnect} loading={disconnecting} style={s.selfStart} />
            </>
          ) : (
            <>
              <Text style={s.mutedSmall}>Connect your YouTube account to access your subscriptions and videos.</Text>
              <Button
                label="Connect YouTube"
                onPress={youtube.connect}
                loading={youtube.connecting}
                leading={<Ionicons name="logo-youtube" size={16} color={colors.primaryForeground} />}
                style={s.selfStart}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Hakkında */}
      <Card>
        <CardHeader>
          <CardTitle>About OwnTube</CardTitle>
        </CardHeader>
        <CardContent style={s.gap}>
          <Text style={s.mutedSmall}>OwnTube is a private YouTube subscription manager that lets you browse your video feed with a clean interface.</Text>
          <Text style={s.mutedSmall}>Your data is stored securely and never shared with third parties.</Text>
        </CardContent>
      </Card>
    </ScrollView>
  )
}

function Bullet({ children, color, marker = '•' }: { children: React.ReactNode; color: string; marker?: string }) {
  return (
    <View style={bulletStyles.row}>
      <Text style={[bulletStyles.text, { color, width: 18 }]}>{marker}</Text>
      <Text style={[bulletStyles.text, { color, flex: 1 }]}>{children}</Text>
    </View>
  )
}

const bulletStyles = StyleSheet.create({
  row: { flexDirection: 'row', marginTop: 4 },
  text: { fontSize: 14, lineHeight: 20 },
})

const useStyles = makeStyles((c) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  content: { paddingHorizontal: 16, paddingVertical: 24, gap: 16 },
  title: { color: c.foreground, fontSize: 24, fontWeight: '700' },
  muted: { color: c.mutedForeground, fontSize: 14 },
  mutedSmall: { color: c.mutedForeground, fontSize: 14, lineHeight: 20 },
  label: { color: c.foreground, fontSize: 14, fontWeight: '500' },
  name: { color: c.foreground, fontSize: 16, fontWeight: '500' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
  stack: { gap: 16 },
  gap: { gap: 8 },
  selfStart: { alignSelf: 'flex-start' },
  bold: { fontWeight: '700' },
  amberStrong: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  amberInner: { padding: 12, borderRadius: radius.sm },
  connected: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: radius.lg },
  connectedText: { fontSize: 14, fontWeight: '500' },
}))
