import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SystemUI from 'expo-system-ui'
import * as WebBrowser from 'expo-web-browser'
import { RefreshCw, WifiOff } from 'lucide-react-native'
import { authClient } from '@/lib/auth-client'
import { API_URL } from '@/lib/config'
import { REQUEST_TIMEOUT_MS } from '@/lib/http'
import { Button, LoadingText } from '@/components/ui'
import { ThemeProvider, useTheme } from '@/lib/theme'

// Web'de (expo web) YouTube izin penceresi bu sayfaya döndüğünde açılır pencereyi kapatır.
WebBrowser.maybeCompleteAuthSession()

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  )
}

// Web'deki app/(protected)/layout.tsx + app/page.tsx yönlendirmesinin karşılığı:
// oturum yoksa yalnızca giriş ekranı, varsa uygulama ekranları erişilebilir.
function AppNavigator() {
  const { colors } = useTheme()
  const { data: session, isPending, error, refetch } = authClient.useSession()
  // Ağ katmanı zaman aşımına rağmen oturum kontrolü bitmezse yine de hata ekranı gösterilir.
  const [stalled, setStalled] = useState(false)

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => {})
  }, [colors.background])

  useEffect(() => {
    if (!isPending) return setStalled(false)
    const timer = setTimeout(() => setStalled(true), REQUEST_TIMEOUT_MS + 5000)
    return () => clearTimeout(timer)
  }, [isPending])

  const statusBar = <StatusBar style={colors.dark ? 'light' : 'dark'} />

  if (!session && (error || stalled)) {
    return <>{statusBar}<ConnectionError message={error?.message} onRetry={() => { setStalled(false); refetch() }} /></>
  }
  if (isPending) return <>{statusBar}<LoadingText /></>

  return (
    <>
      {statusBar}
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Protected guard={Boolean(session)}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="watch/[id]" />
          <Stack.Screen name="channel/[id]" />
        </Stack.Protected>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="login" />
        </Stack.Protected>
      </Stack>
    </>
  )
}

function ConnectionError({ message, onRetry }: { message?: string; onRetry: () => void }) {
  const { colors } = useTheme()
  return (
    <View style={[styles.error, { backgroundColor: colors.background }]}>
      <View style={[styles.errorIcon, { backgroundColor: colors.muted }]}><WifiOff size={24} color={colors.foreground} /></View>
      <Text style={[styles.errorTitle, { color: colors.foreground }]}>Sunucuya bağlanılamadı</Text>
      <Text style={[styles.errorText, { color: colors.mutedForeground }]}>
        İnternet bağlantını kontrol edip tekrar dene.
      </Text>
      {message ? <Text style={[styles.errorDetail, { color: colors.destructiveText }]}>{message}</Text> : null}
      <Text style={[styles.errorDetail, { color: colors.mutedForeground }]}>{API_URL}</Text>
      <Button label="Tekrar dene" icon={RefreshCw} onPress={onRetry} style={styles.retry} />
    </View>
  )
}

const styles = StyleSheet.create({
  error: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  errorIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  errorTitle: { fontSize: 18, fontWeight: '500' },
  errorText: { fontSize: 14, textAlign: 'center' },
  errorDetail: { fontSize: 12, textAlign: 'center', fontFamily: 'monospace' },
  retry: { marginTop: 12 },
})
