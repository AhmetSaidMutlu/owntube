import type { ReactNode } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { radii, theme } from '@/lib/theme'

type IconName = keyof typeof Ionicons.glyphMap

export function Avatar({ uri, name, size = 36 }: { uri?: string | null; name?: string | null; size?: number }) {
  const style = { width: size, height: size, borderRadius: size / 2 }
  if (uri) return <Image source={{ uri }} style={[styles.avatar, style]} contentFit="cover" />
  return (
    <View style={[styles.avatar, styles.avatarFallback, style]}>
      <Text style={[styles.avatarLetter, { fontSize: size * 0.42 }]}>{(name ?? '?').charAt(0).toUpperCase()}</Text>
    </View>
  )
}

export function Button({ label, onPress, icon, variant = 'primary', loading, disabled, style }: {
  label: string
  onPress: () => void
  icon?: IconName
  variant?: 'primary' | 'secondary' | 'danger'
  loading?: boolean
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}) {
  const color = variant === 'primary' ? '#fff' : variant === 'danger' ? theme.danger : theme.text
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [styles.button, styles[variant], (disabled || loading) && styles.disabled, pressed && styles.pressed, style]}
    >
      {loading ? <ActivityIndicator color={color} size="small" /> : icon ? <Ionicons name={icon} size={18} color={color} /> : null}
      <Text style={[styles.buttonText, { color }]}>{label}</Text>
    </Pressable>
  )
}

export function Banner({ message, tone = 'error' }: { message: string; tone?: 'error' | 'success' }) {
  if (!message) return null
  const color = tone === 'error' ? theme.danger : theme.success
  return (
    <View style={[styles.banner, { borderColor: color }]}>
      <Ionicons name={tone === 'error' ? 'alert-circle' : 'checkmark-circle'} size={18} color={color} />
      <Text style={styles.bannerText}>{message}</Text>
    </View>
  )
}

export function EmptyState({ icon, title, description, children }: { icon: IconName; title: string; description: string; children?: ReactNode }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}><Ionicons name={icon} size={26} color={theme.muted} /></View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
      {children}
    </View>
  )
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>
}

export function Loading() {
  return <View style={styles.loading}><ActivityIndicator color={theme.accent} /></View>
}

const styles = StyleSheet.create({
  avatar: { backgroundColor: theme.surfaceRaised },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: theme.text, fontWeight: '700' },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: radii.control, paddingHorizontal: 16, paddingVertical: 13 },
  primary: { backgroundColor: theme.accent },
  secondary: { backgroundColor: theme.surfaceRaised },
  danger: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.danger },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.8 },
  buttonText: { fontSize: 15, fontWeight: '700' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: radii.control, padding: 12, backgroundColor: theme.surface },
  bannerText: { flex: 1, color: theme.text, fontSize: 14, lineHeight: 20 },
  empty: { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 24, gap: 8 },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { color: theme.text, fontSize: 18, fontWeight: '700' },
  emptyDescription: { color: theme.muted, fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 12 },
  card: { backgroundColor: theme.surface, borderRadius: radii.card, padding: 16, gap: 12 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg },
})
