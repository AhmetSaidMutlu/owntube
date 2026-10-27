import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { House, LogOut, Moon, Settings, Sun, Users, Video, type LucideIcon } from 'lucide-react-native'
import { authClient } from '@/lib/auth-client'
import { makeStyles, radius, useTheme } from '@/lib/theme'
import { Button } from './ui'

export type TabName = 'index' | 'videos' | 'subscriptions' | 'settings'

const navItems: { name: TabName; href: '/' | '/videos' | '/subscriptions' | '/settings'; icon: LucideIcon; label: string }[] = [
  { name: 'index', href: '/', icon: House, label: 'Home' },
  { name: 'videos', href: '/videos', icon: Video, label: 'Videos' },
  { name: 'subscriptions', href: '/subscriptions', icon: Users, label: 'Subs' },
  { name: 'settings', href: '/settings', icon: Settings, label: 'Settings' },
]

/** Web'deki components/navbar.tsx mobil görünümü: solda ikonlu sekmeler, sağda tema ve çıkış. */
export function TopNav({ active, onNavigate }: { active?: TabName; onNavigate?: (name: TabName) => void }) {
  const { colors, toggle } = useTheme()
  const insets = useSafeAreaInsets()
  const s = useStyles()

  return (
    <View style={[s.nav, { paddingTop: insets.top }]}>
      <View style={s.bar}>
        <View style={s.items}>
          {navItems.map(({ name, href, icon: Icon, label }) => {
            const color = active === name ? colors.foreground : colors.mutedForeground
            return (
              <Pressable
                key={name}
                onPress={() => (onNavigate ? onNavigate(name) : router.navigate(href))}
                style={({ pressed }) => [s.item, pressed && { opacity: 0.6 }]}
                accessibilityLabel={label}
              >
                <Icon size={18} color={color} />
                <Text style={[s.label, { color }]}>{label}</Text>
              </Pressable>
            )
          })}
        </View>
        <View style={s.right}>
          <Button variant="ghost" size="icon" icon={colors.dark ? Moon : Sun} onPress={toggle} style={s.iconButton} />
          <Button variant="outline" size="sm" icon={LogOut} onPress={() => authClient.signOut()} style={s.logout} />
        </View>
      </View>
    </View>
  )
}

const useStyles = makeStyles((c) => StyleSheet.create({
  nav: { backgroundColor: c.background, borderBottomWidth: 1, borderBottomColor: c.border },
  bar: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  items: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  item: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.sm },
  label: { fontSize: 9, fontWeight: '500', marginTop: 2 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconButton: { width: 32, height: 32 },
  logout: { height: 32, paddingHorizontal: 10 },
}))
