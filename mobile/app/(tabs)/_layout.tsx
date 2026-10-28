import { Tabs } from 'expo-router'
import { AppHeader, BottomNav, type TabName } from '@/components/AppNav'
import { useTheme } from '@/lib/theme'

// Mobil uygulamalardaki gibi: üstte logo çubuğu, sekmeler ekranın altında.
export default function TabsLayout() {
  const { colors } = useTheme()
  return (
    <Tabs
      tabBar={({ state, navigation }) => (
        <BottomNav
          active={state.routes[state.index]?.name as TabName}
          onNavigate={(name) => navigation.navigate(name)}
        />
      )}
      screenOptions={{ header: () => <AppHeader />, sceneStyle: { backgroundColor: colors.background } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="videos" options={{ title: 'Videos' }} />
      <Tabs.Screen name="subscriptions" options={{ title: 'Subs' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  )
}
