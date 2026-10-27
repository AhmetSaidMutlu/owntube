import { useEffect, useRef } from 'react'
import { StyleSheet, View } from 'react-native'
import { WebView, type WebViewMessageEvent } from 'react-native-webview'

// YouTube IFrame API'si WebView içinde çalışır; oynatma durumu postMessage ile RN tarafına iletilir.
// baseUrl, YouTube'un gömülü oynatıcı için istediği geçerli bir köken (referrer) sağlar.
const BASE_URL = 'https://www.youtube.com'

function playerHtml(videoId: string) {
  return `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>html,body{margin:0;height:100%;background:#000;overflow:hidden}#player{width:100%;height:100%}</style>
</head><body><div id="player"></div>
<script src="https://www.youtube.com/iframe_api"></script>
<script>
function post(data){window.ReactNativeWebView.postMessage(JSON.stringify(data))}
function onYouTubeIframeAPIReady(){
  new YT.Player('player',{videoId:${JSON.stringify(videoId)},
    playerVars:{autoplay:1,playsinline:1,rel:0,modestbranding:1,origin:${JSON.stringify(BASE_URL)}},
    events:{
      onReady:function(e){e.target.playVideo()},
      onStateChange:function(e){post({type:'state',playing:e.data===1})},
      onError:function(e){post({type:'error',code:e.data})}
    }})
}
</script></body></html>`
}

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
        source={{ html: playerHtml(videoId), baseUrl: BASE_URL }}
        style={styles.webview}
        onMessage={onMessage}
        allowsInlineMediaPlayback
        allowsFullscreenVideo
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        scrollEnabled={false}
        bounces={false}
        originWhitelist={['*']}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  webview: { flex: 1, backgroundColor: '#000' },
})
