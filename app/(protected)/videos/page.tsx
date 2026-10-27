'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { VideoCard } from '@/components/video-card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { AlertCircle, Video, Loader2, RefreshCw } from 'lucide-react'

interface VideoItem {
  id: string
  video_id: string
  title: string
  description: string
  thumbnail_url: string
  channel_id: string
  channel_title: string
  published_at: string
  video_url: string
  channel_thumbnail?: string
  is_watched?: boolean
  watched_at?: string
  is_dismissed?: boolean
}

const PAGE_SIZE = 20
const LOAD_THRESHOLD = 300
const PULL_THRESHOLD = 80
const SCROLL_POS_KEY = 'videos_scroll_pos'
const DISMISSED_KEY = 'videos_dismissed_ids'

/**
 * Smart sorting algorithm — 4 priority buckets:
 *
 * 1. İzlenmemiş + Yeni  (son 7 gün)   → yeniden eskiye
 * 2. İzlenmemiş + Eski  (7 günden eski) → eskiden yeniye
 * 3. İzlenmiş   + Eski                 → eskiden yeniye
 * 4. İzlenmiş   + Yeni                 → yeniden eskiye
 */
function smartSort(videos: VideoItem[]): VideoItem[] {
  const now = Date.now()
  const NEW_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000

  const bucket = (v: VideoItem): number => {
    const watched = v.is_watched === true
    const publishedMs = new Date(v.published_at).getTime()
    const isNew = now - publishedMs < NEW_THRESHOLD_MS
    if (!watched && isNew) return 1
    if (!watched && !isNew) return 2
    if (watched && !isNew) return 3
    return 4
  }

  return [...videos].sort((a, b) => {
    const ba = bucket(a)
    const bb = bucket(b)
    if (ba !== bb) return ba - bb
    const ta = new Date(a.published_at).getTime()
    const tb = new Date(b.published_at).getTime()
    return (ba === 1 || ba === 4) ? tb - ta : ta - tb
  })
}

// ─── Dismissed ID helpers ─────────────────────────────────────────────────────
function getDismissedIds(): Set<string> {
  try {
    const raw = sessionStorage.getItem(DISMISSED_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch { return new Set() }
}
function addDismissedId(id: string) {
  try {
    const set = getDismissedIds()
    set.add(id)
    sessionStorage.setItem(DISMISSED_KEY, JSON.stringify([...set]))
  } catch { }
}

// ─── SwipeableVideoCard wrapper ───────────────────────────────────────────────
function SwipeableVideoCard({
  video,
  onDismiss,
}: {
  video: VideoItem
  onDismiss: (id: string) => void
}) {
  const startXRef = useRef<number | null>(null)
  const startYRef = useRef<number | null>(null)
  const directionRef = useRef<'horizontal' | 'vertical' | null>(null)
  const [offset, setOffset] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  const SWIPE_THRESHOLD = 80
  const DIRECTION_LOCK_PX = 8 // kaç pixel sonra yön kilitlensin

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX
    startYRef.current = e.touches[0].clientY
    directionRef.current = null
  }
  const handleTouchMove = (e: React.TouchEvent) => {
    if (startXRef.current === null || startYRef.current === null) return

    const dx = e.touches[0].clientX - startXRef.current
    const dy = e.touches[0].clientY - startYRef.current

    // Yön henüz kilitlenmediyse belirle
    if (directionRef.current === null) {
      if (Math.abs(dx) < DIRECTION_LOCK_PX && Math.abs(dy) < DIRECTION_LOCK_PX) return
      directionRef.current = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical'
    }

    // Dikey hareket → scroll'a bırak, swipe'ı sıfırla
    if (directionRef.current === 'vertical') {
      if (offset !== 0) setOffset(0)
      return
    }

    // Yatay hareket → swipe
    setOffset(dx)
  }
  const handleTouchEnd = () => {
    if (directionRef.current === 'horizontal' && Math.abs(offset) >= SWIPE_THRESHOLD) {
      setDismissed(true)
      setTimeout(() => onDismiss(video.video_id), 300)
    } else {
      setOffset(0)
    }
    startXRef.current = null
    startYRef.current = null
    directionRef.current = null
  }

  if (dismissed) return null

  return (
    <div
      className="relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Swipe hint backgrounds */}
      <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none rounded-xl">
        <div className={`flex items-center gap-1 text-xs font-medium text-red-400 transition-opacity ${offset > 20 ? 'opacity-100' : 'opacity-0'}`}>
          <span>✕</span><span>İlgileniyorum</span>
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium text-red-400 transition-opacity ${offset < -20 ? 'opacity-100' : 'opacity-0'}`}>
          <span>İlgilenmiyorum</span><span>✕</span>
        </div>
      </div>

      <div
        style={{
          transform: `translateX(${offset}px)`,
          opacity: dismissed ? 0 : 1 - Math.abs(offset) / 300,
          transition: dismissed ? 'transform 0.3s ease, opacity 0.3s ease' : offset === 0 ? 'transform 0.2s ease' : 'none',
        }}
      >
        <VideoCard
          id={video.video_id || video.id}
          title={video.title}
          description={video.description}
          thumbnail={video.thumbnail_url}
          channelTitle={video.channel_title}
          channelThumbnail={video.channel_thumbnail}
          channelId={video.channel_id}
          publishedAt={video.published_at}
          videoUrl={video.video_url}
          isWatched={video.is_watched}
        />
      </div>
    </div>
  )
}

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [error, setError] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  const pageRef = useRef(0)
  const hasMoreRef = useRef(true)
  const isFetchingRef = useRef(false)
  const thumbMapRef = useRef<Record<string, string>>({})
  const refreshingRef = useRef(false)
  const videosRef = useRef<VideoItem[]>([])

  const pullDistanceRef = useRef(0)
  const setPullDistanceSynced = useCallback((val: number) => {
    pullDistanceRef.current = val
    setPullDistance(val)
  }, [])

  const scrollContainerRef = useRef<HTMLElement | null>(null)
  const innerRef = useRef<HTMLDivElement | null>(null)

  const setVideosSynced = useCallback((items: VideoItem[]) => {
    videosRef.current = items
    setVideos(items)
  }, [])

  // ─── Dismiss handler ───────────────────────────────────────────────────────
  const handleDismiss = useCallback((videoId: string) => {
    addDismissedId(videoId)
    setVideosSynced(videosRef.current.filter((v) => v.video_id !== videoId))
  }, [setVideosSynced])

  // ─── Restore scroll position on mount ────────────────────────────────────
  const scrollRestoredRef = useRef(false)

  useEffect(() => {
    if (loading || scrollRestoredRef.current) return
    scrollRestoredRef.current = true

    const saved = sessionStorage.getItem(SCROLL_POS_KEY)
    if (!saved) return

    const pos = parseInt(saved, 10)
    if (!pos) return

    // Wait for layout then scroll
    const tid = setTimeout(() => {
      const container = scrollContainerRef.current ?? document.documentElement
      container.scrollTo({ top: pos, behavior: 'instant' as ScrollBehavior })
      sessionStorage.removeItem(SCROLL_POS_KEY)
    }, 100)

    return () => clearTimeout(tid)
  }, [loading])

  // ─── Save scroll position when navigating away ───────────────────────────
  useEffect(() => {
    const saveScroll = () => {
      const container = scrollContainerRef.current ?? document.documentElement
      sessionStorage.setItem(SCROLL_POS_KEY, String(container.scrollTop))
    }
    // Save on any link/router navigation click
    window.addEventListener('beforeunload', saveScroll)
    // Also intercept card clicks via bubbling
    const inner = innerRef.current
    inner?.addEventListener('click', saveScroll)
    return () => {
      window.removeEventListener('beforeunload', saveScroll)
      inner?.removeEventListener('click', saveScroll)
    }
  }, [loading])

  // ─── Thumbnail map ──────────────────────────────────────────────────────
  const loadThumbMap = useCallback(async () => {
    const response = await fetch('/api/subscriptions')
    if (!response.ok) return
    const { subscriptions: subs } = await response.json()

    const map: Record<string, string> = {}
    for (const s of subs ?? []) {
      if (s.channelId && s.channelThumbnail) map[s.channelId] = s.channelThumbnail
    }
    thumbMapRef.current = map
  }, [])

  // ─── Fetch a page ──────────────────────────────────────────────────────
  const fetchPage = useCallback(async (pageIndex: number, replace = false) => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true
    try {
      const response = await fetch(`/api/videos?limit=${PAGE_SIZE}&offset=${pageIndex * PAGE_SIZE}`)
      if (!response.ok) { setError('Failed to load videos'); return }
      const { videos: data } = await response.json()

      const dismissed = getDismissedIds()
      const rows = (data ?? [])
        .map((v: any) => ({
          ...v,
          video_id: v.videoId,
          thumbnail_url: v.thumbnailUrl,
          channel_id: v.channelId,
          channel_title: v.channelTitle,
          published_at: v.publishedAt,
          video_url: v.videoUrl,
          is_watched: v.isWatched,
          watched_at: v.watchedAt,
          channel_thumbnail: thumbMapRef.current[v.channelId] ?? undefined,
        }))
        .filter((v: VideoItem) => !dismissed.has(v.video_id))

      if ((data ?? []).length < PAGE_SIZE) hasMoreRef.current = false

      const prev = replace ? [] : videosRef.current
      const sorted = smartSort([...prev, ...rows])
      setVideosSynced(sorted)
      pageRef.current = pageIndex
    } catch (e) {
      console.error(e)
      setError('Failed to load videos')
    } finally {
      isFetchingRef.current = false
    }
  }, [])

  // ─── Initial load ───────────────────────────────────────────────────────
  useEffect(() => {
    ; (async () => {
      setLoading(true)
      await loadThumbMap()
      await fetchPage(0, true)
      setLoading(false)
    })()
  }, [loadThumbMap, fetchPage])

  // ─── doRefresh ──────────────────────────────────────────────────────────
  const doRefresh = useCallback(async () => {
    if (refreshingRef.current || isFetchingRef.current) return
    refreshingRef.current = true
    setRefreshing(true)
    setError('')
    hasMoreRef.current = true
    try {
      await loadThumbMap()
      await fetchPage(0, true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to refresh')
    } finally {
      refreshingRef.current = false
      setRefreshing(false)
      setPullDistanceSynced(0)
    }
  }, [loadThumbMap, fetchPage, setPullDistanceSynced])

  const doSync = useCallback(async () => {
    if (refreshingRef.current || isFetchingRef.current) return
    refreshingRef.current = true
    setRefreshing(true)
    setError('')
    try {
      const response = await fetch('/api/sync-videos', { method: 'POST' })
      if (!response.ok) throw new Error((await response.json()).error || 'Sync failed')
      await loadThumbMap()
      await fetchPage(0, true)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to sync')
    } finally {
      refreshingRef.current = false
      setRefreshing(false)
    }
  }, [loadThumbMap, fetchPage])

  // ─── Scroll container bul ──────────────────────────────────────────────
  useEffect(() => {
    if (loading || !innerRef.current) return
    const tid = setTimeout(() => {
      let node: HTMLElement | null = innerRef.current?.parentElement ?? null
      while (node && node !== document.documentElement) {
        const style = getComputedStyle(node)
        if (/(auto|scroll|overlay)/.test(style.overflow + style.overflowY)) {
          scrollContainerRef.current = node
          return
        }
        node = node.parentElement
      }
      scrollContainerRef.current = document.documentElement
    }, 200)
    return () => clearTimeout(tid)
  }, [loading])

  // ─── Scroll + touch listeners ──────────────────────────────────────────
  const pullStartYRef = useRef<number | null>(null)
  const isPullingRef = useRef(false)

  useEffect(() => {
    if (loading) return
    const tid = setTimeout(() => {
      const triggerLoadMore = async () => {
        if (!hasMoreRef.current || isFetchingRef.current) return
        const container = scrollContainerRef.current ?? document.documentElement
        const distBottom = container.scrollHeight - container.scrollTop - container.clientHeight
        if (distBottom < LOAD_THRESHOLD) {
          setLoadingMore(true)
          await fetchPage(pageRef.current + 1)
          setLoadingMore(false)
        }
      }

      const getScrollTop = () =>
        (scrollContainerRef.current ?? document.documentElement).scrollTop

      const onTouchStart = (e: TouchEvent) => {
        if (getScrollTop() <= 0) {
          pullStartYRef.current = e.touches[0].clientY
          isPullingRef.current = true
        }
      }
      const onTouchMove = (e: TouchEvent) => {
        if (!isPullingRef.current || pullStartYRef.current === null) return
        const delta = e.touches[0].clientY - pullStartYRef.current
        if (delta > 0) setPullDistanceSynced(Math.min(delta, PULL_THRESHOLD * 1.5))
      }
      const onTouchEnd = () => {
        if (isPullingRef.current && pullDistanceRef.current >= PULL_THRESHOLD) doRefresh()
        else setPullDistanceSynced(0)
        isPullingRef.current = false
        pullStartYRef.current = null
      }

      const container = scrollContainerRef.current ?? document.documentElement
      const onScroll = () => triggerLoadMore()

      container.addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener('touchstart', onTouchStart, { passive: true })
      window.addEventListener('touchmove', onTouchMove, { passive: true })
      window.addEventListener('touchend', onTouchEnd)

      return () => {
        container.removeEventListener('scroll', onScroll)
        window.removeEventListener('scroll', onScroll)
        window.removeEventListener('touchstart', onTouchStart)
        window.removeEventListener('touchmove', onTouchMove)
        window.removeEventListener('touchend', onTouchEnd)
      }
    }, 200)
    return () => clearTimeout(tid)
  }, [loading, fetchPage, doRefresh, setPullDistanceSynced])

  const filters = ['All', 'Gaming', 'Music', 'News', 'Live', 'Tech', 'Sports']

  return (
    <div className="min-h-screen bg-background">
      {/* Filter bar + Sync button */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-1">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter.toLowerCase())}
                className={`
                  px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors
                  ${activeFilter === filter.toLowerCase()
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-foreground hover:bg-muted/70'
                  }
                `}
              >
                {filter}
              </button>
            ))}
          </div>

          <button
            onClick={doSync}
            disabled={refreshing}
            className="
              flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
              bg-muted text-foreground hover:bg-muted/70 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed shrink-0
            "
            title="Sync latest videos from YouTube"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{refreshing ? 'Syncing…' : 'Sync'}</span>
          </button>
        </div>
      </div>

      {/* Pull-to-refresh indicator */}
      {(pullDistance > 0 || refreshing) && (
        <div
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground transition-all duration-150 overflow-hidden"
          style={{ height: refreshing ? 40 : Math.min(pullDistance * 0.5, 40) }}
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            style={{ transform: `rotate(${(pullDistance / PULL_THRESHOLD) * 180}deg)` }}
          />
          <span>
            {refreshing ? 'Syncing…' : pullDistance >= PULL_THRESHOLD ? 'Release to sync' : 'Pull to sync'}
          </span>
        </div>
      )}

      <div ref={innerRef} className="px-4 py-4 max-w-screen-2xl mx-auto">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="grid gap-x-4 gap-y-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-2 animate-pulse">
                <div className="aspect-video w-full rounded-xl bg-muted" />
                <div className="flex gap-2 pt-1">
                  <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-muted rounded w-full" />
                    <div className="h-3.5 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="py-16">
            <Empty>
              <EmptyMedia variant="icon"><Video className="size-6" /></EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No videos yet</EmptyTitle>
                <EmptyDescription>Press Sync to fetch the latest videos from your subscriptions.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <>
            {/* Swipe hint — sadece mobilde göster */}
            <p className="sm:hidden text-xs text-muted-foreground text-center mb-3">
              💡 Bir videoyu görmek istemiyorsan sola veya sağa kaydır
            </p>

            <div className="grid gap-x-4 gap-y-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {videos.map((video) => (
                <SwipeableVideoCard
                  key={video.id}
                  video={video}
                  onDismiss={handleDismiss}
                />
              ))}
            </div>

            <div className="mt-8 flex justify-center pb-8 min-h-[40px]">
              {loadingMore && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading more videos…</span>
                </div>
              )}
              {!hasMoreRef.current && !loadingMore && (
                <p className="text-muted-foreground text-sm">All videos loaded</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
