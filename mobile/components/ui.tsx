import { useEffect, useRef, type ReactNode } from 'react'
import { ActivityIndicator, Animated, Easing, Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native'
import { Image } from 'expo-image'
import { CircleAlert, CircleCheck, type LucideIcon } from 'lucide-react-native'
import { makeStyles, radius, useTheme } from '@/lib/theme'

// Web'deki components/ui/* (shadcn) bileşenlerinin mobil karşılıkları.

export function Avatar({ uri, name, size = 36, style }: { uri?: string | null; name?: string | null; size?: number; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme()
  const shape = { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.muted }
  if (uri) return <Image source={{ uri }} style={[shape, style as object]} contentFit="cover" />
  return (
    <View style={[shape, styles.center, style]}>
      <Text style={{ color: colors.mutedForeground, fontSize: size * 0.38, fontWeight: '500' }}>{(name ?? '?').charAt(0).toUpperCase()}</Text>
    </View>
  )
}

/** Dönen ikon (web'deki `animate-spin`). */
export function Spin({ icon: Icon, size = 16, color, spinning = true }: { icon: LucideIcon; size?: number; color: string; spinning?: boolean }) {
  const rotation = useRef(new Animated.Value(0)).current
  useEffect(() => {
    if (!spinning) {
      rotation.stopAnimation()
      rotation.setValue(0)
      return
    }
    const loop = Animated.loop(Animated.timing(rotation, { toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: true }))
    loop.start()
    return () => loop.stop()
  }, [spinning, rotation])
  const rotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })
  return <Animated.View style={{ transform: [{ rotate }] }}><Icon size={size} color={color} /></Animated.View>
}

type ButtonVariant = 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive'
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon'

export function Button({ label, onPress, icon, leading, iconSpin, variant = 'default', size = 'default', loading, disabled, style, textStyle, children }: {
  label?: string
  onPress?: () => void
  icon?: LucideIcon
  /** Lucide dışı bir ikon (ör. Ionicons YouTube logosu) için baştaki öğe. */
  leading?: ReactNode
  iconSpin?: boolean
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
  children?: ReactNode
}) {
  const { colors } = useTheme()
  const variants: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
    default: { bg: colors.primary, fg: colors.primaryForeground },
    outline: { bg: colors.outlineBg, fg: colors.foreground, border: colors.input },
    secondary: { bg: colors.secondary, fg: colors.foreground },
    ghost: { bg: 'transparent', fg: colors.foreground },
    destructive: { bg: colors.destructiveBg, fg: '#ffffff' },
  }
  const sizes: Record<ButtonSize, ViewStyle> = {
    default: { height: 36, paddingHorizontal: icon || loading ? 12 : 16 },
    sm: { height: 32, paddingHorizontal: icon || loading ? 10 : 12, gap: 6 },
    lg: { height: 40, paddingHorizontal: icon || loading ? 16 : 24 },
    icon: { height: 36, width: 36, paddingHorizontal: 0 },
  }
  const v = variants[variant]
  const iconSize = size === 'lg' ? 20 : 16
  const inactive = disabled || loading
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        sizes[size],
        { backgroundColor: v.bg, borderColor: v.border ?? 'transparent', borderWidth: v.border ? StyleSheet.hairlineWidth * 2 : 0 },
        pressed && { opacity: 0.85 },
        inactive && { opacity: 0.5 },
        style,
      ]}
    >
      {loading && !icon ? <ActivityIndicator size="small" color={v.fg} /> : icon ? <Spin icon={icon} size={iconSize} color={v.fg} spinning={Boolean(iconSpin || (loading && icon))} /> : leading}
      {label ? <Text style={[styles.buttonText, { color: v.fg }, textStyle]}>{label}</Text> : null}
      {children}
    </Pressable>
  )
}

const useCardStyles = makeStyles((c) => StyleSheet.create({
  card: { backgroundColor: c.card, borderColor: c.border, borderWidth: 1, borderRadius: radius.xl, paddingVertical: 24, gap: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  header: { paddingHorizontal: 24, gap: 8 },
  title: { color: c.foreground, fontSize: 16, fontWeight: '600' },
  description: { color: c.mutedForeground, fontSize: 14, lineHeight: 20 },
  content: { paddingHorizontal: 24 },
}))

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const s = useCardStyles()
  return <View style={[s.card, style]}>{children}</View>
}

export function CardHeader({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const s = useCardStyles()
  return <View style={[s.header, style]}>{children}</View>
}

export function CardTitle({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const s = useCardStyles()
  return <Text style={[s.title, style]}>{children}</Text>
}

export function CardDescription({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const s = useCardStyles()
  return <Text style={[s.description, style]}>{children}</Text>
}

export function CardContent({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const s = useCardStyles()
  return <View style={[s.content, style]}>{children}</View>
}

/** Web'deki <Alert>: hata (destructive) ya da başarı (yeşil) mesajı. */
export function Alert({ message, variant = 'destructive', style, children }: { message?: string; variant?: 'destructive' | 'success'; style?: StyleProp<ViewStyle>; children?: ReactNode }) {
  const { colors } = useTheme()
  if (!message) return null
  const success = variant === 'success'
  const fg = success ? colors.successText : colors.destructiveText
  const Icon = success ? CircleCheck : CircleAlert
  return (
    <View style={[styles.alert, { backgroundColor: success ? colors.successBg : colors.card, borderColor: success ? colors.successBorder : colors.border }, style]}>
      <View style={styles.alertIcon}><Icon size={16} color={success ? colors.success : fg} /></View>
      <View style={styles.flex}>
        <Text style={[styles.alertText, { color: fg }]}>{message}</Text>
        {children}
      </View>
    </View>
  )
}

/** Web'deki <Empty> (ikon kutusu + başlık + açıklama). */
export function Empty({ icon: Icon, title, description, children }: { icon: LucideIcon; title: string; description: string; children?: ReactNode }) {
  const { colors } = useTheme()
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}><Icon size={24} color={colors.foreground} /></View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.emptyDescription, { color: colors.mutedForeground }]}>{description}</Text>
      {children}
    </View>
  )
}

/** Web'deki `animate-pulse bg-muted` iskelet blokları. */
export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme()
  const opacity = useRef(new Animated.Value(1)).current
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
    ]))
    loop.start()
    return () => loop.stop()
  }, [opacity])
  return <Animated.View style={[{ backgroundColor: colors.skeleton, borderRadius: 4, opacity }, style]} />
}

/** Web'deki ortalanmış "Loading..." yazısı. */
export function LoadingText({ label = 'Loading...' }: { label?: string }) {
  const { colors } = useTheme()
  return (
    <View style={[styles.loading, { backgroundColor: colors.background }]}>
      <Text style={{ color: colors.mutedForeground, fontSize: 16 }}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: radius.md },
  buttonText: { fontSize: 14, fontWeight: '500' },
  alert: { flexDirection: 'row', gap: 12, borderWidth: 1, borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 12 },
  alertIcon: { paddingTop: 2 },
  alertText: { fontSize: 14, lineHeight: 20 },
  empty: { alignItems: 'center', gap: 8, padding: 24 },
  emptyIcon: { width: 40, height: 40, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '500' },
  emptyDescription: { fontSize: 14, lineHeight: 20, textAlign: 'center', maxWidth: 320 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
})
