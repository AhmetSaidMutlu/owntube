// Mobil uygulamanın WebView'da açtığı YouTube oynatıcısı. YouTube, gömülü oynatıcıyı açan sayfanın
// gerçek bir web kökeninden gelmesini istiyor; WebView'a doğrudan verilen HTML'de bu kimlik olmadığı
// için oynatıcı 152/153 hatası veriyordu. Oynatma durumu postMessage ile uygulamaya iletilir.
const VIDEO_ID = /^[\w-]{11}$/

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!VIDEO_ID.test(id)) return new Response('Invalid video id', { status: 400 })
  return new Response(playerHtml(id), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}

function playerHtml(videoId: string) {
  return `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<meta name="referrer" content="strict-origin-when-cross-origin">
<style>html,body{margin:0;height:100%;background:#000;overflow:hidden}#player{width:100%;height:100%}</style>
</head><body><div id="player"></div>
<script src="https://www.youtube.com/iframe_api"></script>
<script>
function post(data){if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify(data))}
function onYouTubeIframeAPIReady(){
  new YT.Player('player',{videoId:${JSON.stringify(videoId)},
    playerVars:{autoplay:1,playsinline:1,rel:0,modestbranding:1,origin:location.origin},
    events:{
      onReady:function(e){e.target.playVideo()},
      onStateChange:function(e){post({type:'state',playing:e.data===1})},
      onError:function(e){post({type:'error',code:e.data})}
    }})
}
</script></body></html>`
}
