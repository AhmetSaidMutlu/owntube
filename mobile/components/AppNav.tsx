import { useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { House, LogOut, Moon, RefreshCw, Settings, Sun, Users, Video, type LucideIcon } from 'lucide-react-native'
import { api, syncErrorMessage } from '@/lib/api'
import { authClient } from '@/lib/auth-client'
import { emitVideosSynced } from '@/lib/watched-store'
import { makeStyles, radius, useTheme } from '@/lib/theme'
import { Logo } from './Logo'
import { Button, Spin } from './ui'

export type TabName = 'index' | 'videos' | 'subscriptions' | 'settings'

const navItems: { name: TabName; icon: LucideIcon; label: string }[] = [
  { name: 'index', icon: House, label: 'Home' },
  { name: 'videos', icon: Video, label: 'Videos' },
  { name: 'subscriptions', icon: Users, label: 'Subs' },
  { name: 'settings', icon: Settings, label: 'Settings' },
]

/** Üst çubuk: durum çubuğunun altında logo, sağda senkronizasyon, tema ve çıkış. */
export function AppHeader() {
  const { colors, toggle } = useTheme()
  const insets = useSafeAreaInsets()
  const s = useStyles()
  const [syncing, setSyncing] = useState(false)

  async function sync() {
    setSyncing(true)
    try {
      await api.sync()
      emitVideosSynced()
    } catch (err) {
      Alert.alert('Sync failed', syncErrorMessage(err))
    } finally {
      setSyncing(false)
    }
  }

  return (
    <View style={[s.header, { paddingTop: insets.top }]}>
      <View style={s.headerBar}>
        <View style={s.brand}>
          <Logo size={24} />
          <Text style={s.brandText}>OwnTube</Text>
        </View>
        <View style={s.actions}>
          <Pressable
            onPress={sync}
            disabled={syncing}
            style={({ pressed }) => [s.iconButton, s.center, (pressed || syncing) && { opacity: 0.5 }]}
            accessibilityLabel="Sync latest videos from YouTube"
          >
            <Spin icon={RefreshCw} size={16} color={colors.foreground} spinning={syncing} />
          </Pressable>
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
  headerBar: { height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandText: { color: c.foreground, fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  iconButton: { width: 36, height: 36 },
  center: { alignItems: 'center', justifyContent: 'center' },
  bottom: { flexDirection: 'row', backgroundColor: c.background, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border, paddingTop: 6 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, minHeight: 52 },
  pill: { width: 56, height: 30, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11, fontWeight: '500' },
  labelActive: { fontWeight: '700' },
}))
