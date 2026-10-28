import { useEffect, useRef } from 'react'
import { StyleSheet, View } from 'react-native'
import { WebView, type WebViewMessageEvent } from 'react-native-webview'
import { API_URL } from '@/lib/config'

// Oynatıcı sayfası sunucudan (/embed/[id]) yüklenir: YouTube gömülü oynatıcıyı yalnızca gerçek bir
// web kökeninden açılınca çalıştırıyor, WebView'a verilen yerel HTML'de 152/153 hatası veriyordu.
// Oynatma durumu sayfadan postMessage ile RN tarafına iletilir.

/** Oynatma süresini saniye saniye bildirir (yalnızca video oynarken). */
export function YouTubePlayer({ videoId, onPlaySecond }: { videoId: string; onPlaySecond?: (seconds: number) => void }) {
  const playingRef = useRef(false)
  const secondsRef = useRef(0)
  const callbackRef = useRef(onPlaySecond)
  callbackRef.current = onPlaySecond

  useEffect(() => {
    secondsRef.current = 0
    playingRef.current = false
    const timer = setInterval(() => {
      if (!playingRef.current) return
      secondsRef.current += 1
      callbackRef.current?.(secondsRef.current)
    }, 1000)
    return () => clearInterval(timer)
  }, [videoId])

  function onMessage(event: WebViewMessageEvent) {
    try {
      const data = JSON.parse(event.nativeEvent.data)
      if (data.type === 'state') playingRef.current = data.playing
    } catch {}
  }

  return (
    <View style={styles.container}>
      <WebView
        key={videoId}
        source={{ uri: `${API_URL}/embed/${encodeURIComponent(videoId)}` }}
        style={styles.webview}
        onMessage={onMessage}
        allowsInlineMediaPlayback
        allowsFullscreenVideo
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        scrollEnabled={false}
        bounces={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  webview: { flex: 1, backgroundColor: '#000' },
})
