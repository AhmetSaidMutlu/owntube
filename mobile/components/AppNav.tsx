import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { House, LogOut, Moon, Settings, Sun, Users, Video, type LucideIcon } from 'lucide-react-native'
import { authClient } from '@/lib/auth-client'
import { makeStyles, radius, useTheme } from '@/lib/theme'
import { Logo } from './Logo'
import { Button } from './ui'

export type TabName = 'index' | 'videos' | 'subscriptions' | 'settings'

const navItems: { name: TabName; icon: LucideIcon; label: string }[] = [
  { name: 'index', icon: House, label: 'Home' },
  { name: 'videos', icon: Video, label: 'Videos' },
  { name: 'subscriptions', icon: Users, label: 'Subs' },
  { name: 'settings', icon: Settings, label: 'Settings' },
]

/** Üst çubuk: durum çubuğunun altında logo, sağda tema ve çıkış. */
export function AppHeader() {
  const { colors, toggle } = useTheme()
  const insets = useSafeAreaInsets()
  const s = useStyles()

  return (
    <View style={[s.header, { paddingTop: insets.top }]}>
      <View style={s.headerBar}>
        <View style={s.brand}>
          <Logo size={28} />
          <Text style={s.brandText}>OwnTube</Text>
        </View>
        <View style={s.actions}>
          <Button variant="ghost" size="icon" icon={colors.dark ? Moon : Sun} onPress={toggle} style={s.iconButton} />
          <Button variant="ghost" size="icon" icon={LogOut} onPress={() => authClient.signOut()} style={s.iconButton} />
        </View>
      </View>
    </View>
  )
}

/** Alt sekme çubuğu: Android navigasyon tuşlarının üstünde kalacak kadar alt boşluk bırakır. */
export function BottomNav({ active, onNavigate }: { active?: TabName; onNavigate: (name: TabName) => void }) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const s = useStyles()

  return (
    <View style={[s.bottom, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      {navItems.map(({ name, icon: Icon, label }) => {
        const selected = active === name
        const color = selected ? colors.foreground : colors.mutedForeground
        return (
          <Pressable
            key={name}
            onPress={() => onNavigate(name)}
            style={({ pressed }) => [s.tab, pressed && { opacity: 0.6 }]}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={label}
          >
            <View style={[s.pill, selected && { backgroundColor: colors.muted }]}>
              <Icon size={22} color={color} strokeWidth={selected ? 2.4 : 2} />
            </View>
            <Text style={[s.label, { color }, selected && s.labelActive]}>{label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const useStyles = makeStyles((c) => StyleSheet.create({
  header: { backgroundColor: c.background, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
  headerBar: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandText: { color: c.foreground, fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconButton: { width: 40, height: 40 },
  bottom: { flexDirection: 'row', backgroundColor: c.background, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border, paddingTop: 6 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, minHeight: 52 },
  pill: { width: 56, height: 30, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11, fontWeight: '500' },
  labelActive: { fontWeight: '700' },
}))
