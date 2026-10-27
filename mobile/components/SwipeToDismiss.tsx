import { useMemo, useRef, useState, type ReactNode } from 'react'
import { Animated, PanResponder, StyleSheet, Text, View } from 'react-native'
import { theme } from '@/lib/theme'

const SWIPE_THRESHOLD = 80
const DIRECTION_LOCK_PX = 8

/** Kartı sağa/sola kaydırınca akıştan gizler — web'deki SwipeableVideoCard karşılığı. */
export function SwipeToDismiss({ children, onDismiss }: { children: ReactNode; onDismiss: () => void }) {
  const translateX = useRef(new Animated.Value(0)).current
  const [direction, setDirection] = useState<'left' | 'right' | null>(null)

  const responder = useMemo(() => PanResponder.create({
    // Yön yatay olarak kilitlenene kadar dikey kaydırma listeye kalır.
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > DIRECTION_LOCK_PX && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
    onPanResponderMove: (_, g) => {
      translateX.setValue(g.dx)
      setDirection(g.dx > 20 ? 'right' : g.dx < -20 ? 'left' : null)
    },
    onPanResponderRelease: (_, g) => {
      if (Math.abs(g.dx) >= SWIPE_THRESHOLD) {
        Animated.timing(translateX, { toValue: Math.sign(g.dx) * 500, duration: 220, useNativeDriver: true }).start(onDismiss)
      } else {
        setDirection(null)
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start()
      }
    },
    onPanResponderTerminate: () => {
      setDirection(null)
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start()
    },
  }), [translateX, onDismiss])

  const opacity = translateX.interpolate({ inputRange: [-300, 0, 300], outputRange: [0, 1, 0], extrapolate: 'clamp' })

  return (
    <View>
      <View style={styles.hint} pointerEvents="none">
        <Text style={[styles.hintText, direction !== 'right' && styles.hidden]}>✕ Not interested</Text>
        <Text style={[styles.hintText, direction !== 'left' && styles.hidden]}>Not interested ✕</Text>
      </View>
      <Animated.View style={{ transform: [{ translateX }], opacity }} {...responder.panHandlers}>
        {children}
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  hint: { ...StyleSheet.absoluteFill, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  hintText: { color: theme.danger, fontSize: 13, fontWeight: '600' },
  hidden: { opacity: 0 },
})
