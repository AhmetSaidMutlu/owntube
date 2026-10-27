import { useCallback, useState } from 'react'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import { api } from './api'

const ERROR_MESSAGES: Record<string, string> = {
  token_exchange_failed: 'YouTube token exchange failed. Please check your YouTube API credentials.',
  youtube_auth_failed: 'YouTube authentication failed. Please try again.',
}

/** YouTube hesabını bağlar: Google izin ekranı sistem tarayıcısında açılır, sonuç deep link ile döner. */
export function useYoutubeConnect(onConnected: () => void) {
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState('')

  const connect = useCallback(async () => {
    setConnecting(true)
    setError('')
    try {
      const redirect = Linking.createURL('settings')
      const { url } = await api.youtubeConnectUrl(redirect)
      const result = await WebBrowser.openAuthSessionAsync(url, redirect)
      if (result.type !== 'success') return
      const { queryParams } = Linking.parse(result.url)
      if (queryParams?.connected === 'true') onConnected()
      else setError(ERROR_MESSAGES[String(queryParams?.error)] ?? 'Failed to connect YouTube account. Please try again.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect YouTube account.')
    } finally {
      setConnecting(false)
    }
  }, [onConnected])

  return { connect, connecting, error }
}
