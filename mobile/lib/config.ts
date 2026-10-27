import { Platform } from 'react-native'

// Tarayıcıda (expo web) çerezlerin çalışması için sunucuya localhost üzerinden gidilir.
const url = Platform.OS === 'web'
  ? process.env.EXPO_PUBLIC_WEB_API_URL ?? 'http://localhost:3000'
  : process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

export const API_URL = url.replace(/\/$/, '')
export const IS_WEB = Platform.OS === 'web'
