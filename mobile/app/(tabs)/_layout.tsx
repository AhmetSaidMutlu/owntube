import { Tabs } from 'expo-router'
import { TopNav, type TabName } from '@/components/TopNav'
import { useTheme } from '@/lib/theme'

// Web'deki components/navbar.tsx gibi sekmeler ekranın üstünde durur.
export default function TabsLayout() {
  const { colors } = useTheme()
  return (
    <Tabs
      tabBar={({ state, navigation }) => (
        <TopNav
          active={state.routes[state.index]?.name as TabName}
          onNavigate={(name) => navigation.navigate(name)}
        />
      )}
      screenOptions={{ headerShown: false, tabBarPosition: 'top', sceneStyle: { backgroundColor: colors.background } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="videos" options={{ title: 'Videos' }} />
      <Tabs.Screen name="subscriptions" options={{ title: 'Subs' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  )
}
