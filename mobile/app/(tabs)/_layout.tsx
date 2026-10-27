import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { theme } from '@/lib/theme'

// Web'deki components/navbar.tsx sekmeleriyle aynı: Home, Videos, Subs, Settings.
const icons = {
  index: 'home',
  videos: 'play-circle',
  subscriptions: 'people',
  settings: 'settings',
} as const

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle: { backgroundColor: theme.bg },
        tabBarActiveTintColor: theme.text,
        tabBarInactiveTintColor: theme.subtle,
        tabBarStyle: { backgroundColor: theme.bg, borderTopColor: theme.border },
        tabBarIcon: ({ color, size, focused }) => {
          const name = icons[route.name as keyof typeof icons]
          return <Ionicons name={focused ? name : `${name}-outline`} color={color as string} size={size} />
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="videos" options={{ title: 'Videos' }} />
      <Tabs.Screen name="subscriptions" options={{ title: 'Subs' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  )
}
