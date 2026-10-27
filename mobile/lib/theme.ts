import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useColorScheme } from 'react-native'
import { safeStorage } from './safe-storage'

// Web'deki app/globals.css (shadcn neutral) renklerinin karşılığı. oklch değerleri
// Tailwind neutral paletindeki hex eşdeğerlerine çevrildi.
const light = {
  dark: false,
  background: '#ffffff',
  foreground: '#0a0a0a',
  card: '#ffffff',
  primary: '#171717',
  primaryForeground: '#fafafa',
  secondary: '#f5f5f5',
  muted: '#f5f5f5',
  mutedForeground: '#737373',
  border: '#e5e5e5',
  input: '#e5e5e5',
  outlineBg: '#ffffff',
  destructiveBg: '#e7000b',
  destructiveText: '#e7000b',
  success: '#00a63e',
  successBg: '#f0fdf4',
  successBorder: '#00c950',
  successText: '#016630',
  amberBg: '#fffbeb',
  amberBorder: '#fee685',
  amberTitle: '#7b3306',
  amberText: '#7b3306',
  amberInner: 'rgba(255,255,255,0.5)',
  amberButtonBorder: '#ffb900',
  skeleton: '#f5f5f5',
}

export type Colors = typeof light

const dark: Colors = {
  dark: true,
  background: '#0a0a0a',
  foreground: '#fafafa',
  card: '#0a0a0a',
  primary: '#fafafa',
  primaryForeground: '#171717',
  secondary: '#262626',
  muted: '#262626',
  mutedForeground: '#a1a1a1',
  border: '#262626',
  input: '#262626',
  outlineBg: '#121212',
  destructiveBg: '#521214',
  destructiveText: '#ff6467',
  success: '#00c950',
  successBg: '#032e15',
  successBorder: '#00c950',
  successText: '#b9f8cf',
  amberBg: '#461901',
  amberBorder: '#973c00',
  amberTitle: '#fee685',
  amberText: '#fef3c6',
  amberInner: 'rgba(0,0,0,0.2)',
  amberButtonBorder: '#ffb900',
  skeleton: '#262626',
}

// İzleme ekranı web'de olduğu gibi her temada koyu (#0f0f0f) kalır.
export const watchColors = {
  bg: '#0f0f0f',
  text: '#ffffff',
  chip: 'rgba(255,255,255,0.1)',
  gray200: '#e5e7eb',
  gray400: '#99a1af',
  gray500: '#6a7282',
  gray600: '#4a5565',
  gray800: '#1e2939',
  yellowBg: 'rgba(240,177,0,0.2)',
  yellowText: '#fdc700',
  success: '#00c950',
}

export const radius = { sm: 6, md: 8, lg: 10, xl: 14, full: 999 }

type Preference = 'light' | 'dark' | null
const THEME_KEY = 'owntube_theme'

type ThemeContextValue = { colors: Colors; toggle: () => void }
const ThemeContext = createContext<ThemeContextValue>({ colors: dark, toggle: () => {} })

/** Web'deki next-themes karşılığı: varsayılan sistem teması, navbar'daki düğmeyle açık/koyu seçilir. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme()
  const [preference, setPreference] = useState<Preference>(null)

  useEffect(() => {
    safeStorage.getItemAsync(THEME_KEY).then((value) => {
      if (value === 'light' || value === 'dark') setPreference(value)
    })
  }, [])

  const isDark = (preference ?? system ?? 'dark') === 'dark'
  const toggle = useCallback(() => {
    const next = isDark ? 'light' : 'dark'
    setPreference(next)
    safeStorage.setItemAsync(THEME_KEY, next)
  }, [isDark])

  const value = useMemo(() => ({ colors: isDark ? dark : light, toggle }), [isDark, toggle])
  return createElement(ThemeContext.Provider, { value }, children)
}

export function useTheme() {
  return useContext(ThemeContext)
}

/** Temaya bağlı StyleSheet üretir; stiller yalnızca tema değişince yeniden oluşturulur. */
export function makeStyles<T>(factory: (colors: Colors) => T) {
  return function useStyles() {
    const { colors } = useTheme()
    return useMemo(() => factory(colors), [colors])
  }
}
