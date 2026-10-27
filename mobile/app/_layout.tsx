import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as WebBrowser from 'expo-web-browser'
import { authClient } from '@/lib/auth-client'
import { Loading } from '@/components/ui'
import { theme } from '@/lib/theme'

// Web'de (expo web) YouTube izin penceresi bu sayfaya döndüğünde açılır pencereyi kapatır.
WebBrowser.maybeCompleteAuthSession()

// Web'deki app/(protected)/layout.tsx + app/page.tsx yönlendirmesinin karşılığı:
// oturum yoksa yalnızca giriş ekranı, varsa uygulama ekranları erişilebilir.
export default function RootLayout() {
  const { data: session, isPending } = authClient.useSession()
  if (isPending) return <Loading />

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.bg } }}>
        <Stack.Protected guard={Boolean(session)}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="watch/[id]" />
          <Stack.Screen
            name="channel/[id]"
            options={{ headerShown: true, title: '', headerStyle: { backgroundColor: theme.bg }, headerTintColor: theme.text, headerShadowVisible: false }}
          />
        </Stack.Protected>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="login" />
        </Stack.Protected>
      </Stack>
    </>
  )
}
