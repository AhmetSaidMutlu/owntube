'use client'

import { useEffect, useState, use, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { formatTimeAgo } from '@/lib/youtube'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ExternalLink, ThumbsUp, Share2, Bookmark, ChevronDown, ChevronUp, Settings } from 'lucide-react'
import Image from 'next/image'

const SCROLL_POS_KEY = 'videos_scroll_pos'
const RELATED_PAGE_SIZE = 20

interface VideoDetails {
  id: string
  video_id: string
  title: string
  description: string
  thumbnail_url: string
  channel_id: string
  channel_title: string
  channel_thumbnail?: string
  published_at: string
  video_url: string
}

interface RelatedVideo {
  id: string
  video_id: string
  title: string
  thumbnail_url: string
  channel_title: string
  channel_id?: string
  channel_thumbnail?: string
  published_at: string
  is_watched?: boolean
}

export default function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [video, setVideo] = useState<VideoDetails | null>(null)
  const [relatedVideos, setRelatedVideos] = useState<RelatedVideo[]>([])
  const [relatedPage, setRelatedPage] = useState(0)
  const [hasMoreRelated, setHasMoreRelated] = useState(true)
  const [loadingMoreRelated, setLoadingMoreRelated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [isCurrentWatched, setIsCurrentWatched] = useState(false)
  const watchTimeRef = useRef(0)
  const hasMarkedWatchedRef = useRef(false)

  // Full pool — fetched once, paginated client-side
  const fullPoolRef = useRef<RelatedVideo[]>([])

  useEffect(() => {
    loadVideo()
    watchTimeRef.current = 0
    hasMarkedWatchedRef.current = false
    setIsCurrentWatched(false)
    setRelatedVideos([])
    setRelatedPage(0)
    setHasMoreRelated(true)
    fullPoolRef.current = []
  }, [id])

  // Track watch time and mark as watched after 10 s
  useEffect(() => {
    if (!video) return
    const interval = setInterval(() => {
      watchTimeRef.current += 1
      if (watchTimeRef.current > 10 && !hasMarkedWatchedRef.current) {
        hasMarkedWatchedRef.current = true
        markAsWatched()
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [video?.id])

  // ─── Load next page of related videos ──────────────────────────────────────
  const loadMoreRelated = useCallback(() => {
    const pool = fullPoolRef.current
    const start = (relatedPage + 1) * RELATED_PAGE_SIZE
    const slice = pool.slice(start, start + RELATED_PAGE_SIZE)
    if (slice.length === 0) { setHasMoreRelated(false); return }
    setRelatedVideos((prev) => [...prev, ...slice])
    setRelatedPage((p) => p + 1)
    if (start + RELATED_PAGE_SIZE >= pool.length) setHasMoreRelated(false)
  }, [relatedPage])

  async function markAsWatched() {
    if (!video) return
    try {
      const response = await fetch('/api/mark-watched', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: video.id, watchedPercentage: 35 }),
      })
      if (response.ok) {
        console.log('Video marked as watched')
        setIsCurrentWatched(true)
      }
    } catch (error) {
      console.error('Error marking as watched:', error)
    }
  }

  async function loadVideo() {
    try {
      setLoading(true)
      const response = await fetch(`/api/videos/${id}`)
      if (!response.ok) { router.push('/videos'); return }
      const { video: videoData, related: pool } = await response.json()
      if (!videoData) { router.push('/videos'); return }
      setIsCurrentWatched(videoData.isWatched ?? false)
      setVideo({ ...videoData, video_id: videoData.videoId, thumbnail_url: videoData.thumbnailUrl, channel_id: videoData.channelId, channel_title: videoData.channelTitle, published_at: videoData.publishedAt, video_url: videoData.videoUrl })
      if (!pool) { setRelatedVideos([]); return }
      const withThumb: RelatedVideo[] = pool.map((v: any) => ({ id: v.id, video_id: v.videoId, title: v.title, thumbnail_url: v.thumbnailUrl, channel_title: v.channelTitle, published_at: v.publishedAt, is_watched: v.isWatched, channel_thumbnail: v.channelThumbnail }))

      const sameChannel = withThumb.filter(
        (v) => v.channel_id && v.channel_id === videoData.channel_id && !v.is_watched
      )
      const unwatched = withThumb.filter(
        (v) => !v.is_watched && !(v.channel_id && v.channel_id === videoData.channel_id)
      )
      const watched = withThumb.filter((v) => v.is_watched)

      const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5)

      const sorted = [
        ...shuffle(sameChannel),
        ...shuffle(unwatched),
        ...shuffle(watched),
      ]

      fullPoolRef.current = sorted

      // Show first page
      setRelatedVideos(sorted.slice(0, RELATED_PAGE_SIZE))
      setRelatedPage(0)
      setHasMoreRelated(sorted.length > RELATED_PAGE_SIZE)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  // ─── Save scroll pos and go back ─────────────────────────────────────────
  const handleBack = () => {
    // videos page will read this to restore position
    router.back()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-sm">Loading...</div>
      </div>
    )
  }

  if (!video) return null

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <div className="max-w-screen-2xl mx-auto lg:flex lg:gap-6 lg:px-6 lg:py-6">

        {/* ── Left column: player + info ── */}
        <div className="flex-1 min-w-0">

          {/* Player */}
          <div className="relative w-full aspect-video bg-black lg:rounded-xl overflow-hidden">
            <iframe
              src={`https://www.youtube.com/embed/${video.video_id}?autoplay=1&rel=0&modestbranding=1&vq=hd1080`}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <button
              onClick={handleBack}
              className="lg:hidden absolute top-3 left-3 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Info section */}
          <div className="px-4 py-3 lg:px-0">
            <h1 className="text-base font-semibold leading-snug mb-2">{video.title}</h1>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {/* Channel */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push(`/channel/${video.channel_id}`)}
                  className="w-9 h-9 rounded-full bg-gray-600 flex items-center justify-center text-sm font-semibold shrink-0 hover:opacity-80 transition-opacity overflow-hidden"
                  aria-label={`Go to ${video.channel_title}`}
                >
                  {video.channel_thumbnail ? (
                    <Image src={video.channel_thumbnail} alt={video.channel_title} width={36} height={36} className="object-cover w-full h-full" />
                  ) : (
                    video.channel_title.charAt(0).toUpperCase()
                  )}
                </button>
                <button
                  onClick={() => router.push(`/channel/${video.channel_id}`)}
                  className="text-left hover:opacity-80 transition-opacity"
                >
                  <p className="font-medium text-sm">{video.channel_title}</p>
                  <p className="text-xs text-gray-400">1.2M subscribers</p>
                </button>
                <button className="ml-2 px-4 py-1.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-gray-200 transition-colors">
                  Subscribe
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 sm:pb-0">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors shrink-0">
                  <ThumbsUp className="w-4 h-4" /><span>Like</span>
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors shrink-0">
                  <Share2 className="w-4 h-4" /><span>Share</span>
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors shrink-0">
                  <Bookmark className="w-4 h-4" /><span>Save</span>
                </button>
                <button
                  onClick={() => window.open(`https://www.youtube.com/watch?v=${video.video_id}`, '_blank')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors shrink-0"
                >
                  <ExternalLink className="w-4 h-4" /><span>YouTube</span>
                </button>
                {/* Quality settings button */}
                <button
                  onClick={() => window.open(`https://www.youtube.com/watch?v=${video.video_id}&vq=hd1080`, '_blank')}
                  title="YouTube'da HD olarak aç (1080p)"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 text-sm font-medium transition-colors shrink-0"
                >
                  <Settings className="w-4 h-4" /><span>HD</span>
                </button>
              </div>
            </div>

            {/* Description */}
            <div
              className="mt-3 p-3 rounded-xl bg-white/10 cursor-pointer select-none"
              onClick={() => setShowFullDescription(!showFullDescription)}
            >
              <div className="flex items-center gap-3 mb-1.5 text-sm text-gray-400">
                <span>{formatTimeAgo(video.published_at)}</span>
              </div>
              <p className={`text-sm text-gray-200 whitespace-pre-line ${showFullDescription ? '' : 'line-clamp-3'}`}>
                {video.description || 'No description available.'}
              </p>
              {video.description && video.description.length > 120 && (
                <div className="flex items-center gap-1 mt-2 text-sm font-medium">
                  {showFullDescription
                    ? <><ChevronUp className="w-4 h-4" /><span>Show less</span></>
                    : <><ChevronDown className="w-4 h-4" /><span>Show more</span></>}
                </div>
              )}
            </div>
          </div>

          {/* Related videos — mobile */}
          {relatedVideos.length > 0 && (
            <div className="lg:hidden px-4 pb-8">
              <RelatedVideoList
                videos={relatedVideos}
                channelTitle={video.channel_title}
                hasMore={hasMoreRelated}
                loadingMore={loadingMoreRelated}
                onLoadMore={async () => {
                  setLoadingMoreRelated(true)
                  loadMoreRelated()
                  setLoadingMoreRelated(false)
                }}
                onSelect={(vid) => router.push(`/watch/${vid}`)}
                onChannelClick={(cid) => router.push(`/channel/${cid}`)}
              />
            </div>
          )}
        </div>

        {/* ── Right column: related sidebar (desktop) ── */}
        {relatedVideos.length > 0 && (
          <aside className="hidden lg:block w-[400px] xl:w-[420px] shrink-0">
            <RelatedVideoList
              videos={relatedVideos}
              channelTitle={video.channel_title}
              hasMore={hasMoreRelated}
              loadingMore={loadingMoreRelated}
              onLoadMore={async () => {
                setLoadingMoreRelated(true)
                loadMoreRelated()
                setLoadingMoreRelated(false)
              }}
              onSelect={(vid) => router.push(`/watch/${vid}`)}
              onChannelClick={(cid) => router.push(`/channel/${cid}`)}
            />
          </aside>
        )}
      </div>
    </div>
  )
}

/* ── Related video list ── */
function RelatedVideoList({
  videos,
  channelTitle,
  hasMore,
  loadingMore,
  onLoadMore,
  onSelect,
  onChannelClick,
}: {
  videos: RelatedVideo[]
  channelTitle: string
  hasMore: boolean
  loadingMore: boolean
  onLoadMore: () => Promise<void>
  onSelect: (videoId: string) => void
  onChannelClick: (channelId: string) => void
}) {
  const loaderRef = useRef<HTMLDivElement | null>(null)

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loaderRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          onLoadMore()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, onLoadMore])

  return (
    <div>
      {/* Filter chips */}
      <div className="flex items-center gap-2 mb-3 overflow-x-auto scrollbar-hide pb-1">
        <button className="px-3 py-1.5 rounded-lg bg-white text-black text-sm font-medium shrink-0">All</button>
        <button className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium shrink-0 transition-colors">
          From {channelTitle.length > 20 ? channelTitle.slice(0, 20) + '…' : channelTitle}
        </button>
        <button className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium shrink-0 transition-colors">
          Related
        </button>
      </div>

      {/* Video list */}
      <div className="space-y-3">
        {videos.map((related) => (
          <div key={related.id} className="flex gap-2 group">
            {/* Thumbnail */}
            <button
              onClick={() => onSelect(related.video_id)}
              className="relative w-40 lg:w-44 aspect-video rounded-lg overflow-hidden bg-gray-800 shrink-0"
            >
              <Image
                src={related.thumbnail_url}
                alt={related.title}
                fill
                className={`object-cover transition-opacity group-hover:opacity-90 ${related.is_watched ? 'opacity-50' : ''}`}
              />
              {related.is_watched && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-[10px] text-white font-medium">Watched</span>
                  </div>
                </div>
              )}
            </button>

            {/* Meta */}
            <div className="flex-1 min-w-0 py-0.5">
              <button onClick={() => onSelect(related.video_id)} className="text-left w-full">
                <h3 className={`text-sm font-medium line-clamp-2 leading-snug transition-colors group-hover:text-gray-300 ${related.is_watched ? 'text-gray-400' : ''}`}>
                  {related.title}
                </h3>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); if (related.channel_id) onChannelClick(related.channel_id) }}
                className="flex items-center gap-1.5 mt-1 group/ch"
              >
                <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-600 shrink-0 flex items-center justify-center text-[10px] font-semibold">
                  {related.channel_thumbnail ? (
                    <Image src={related.channel_thumbnail} alt={related.channel_title} width={20} height={20} className="object-cover w-full h-full" />
                  ) : (
                    related.channel_title.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="text-xs text-gray-400 group-hover/ch:text-gray-200 transition-colors truncate">
                  {related.channel_title}
                </span>
              </button>

              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-xs text-gray-500">{formatTimeAgo(related.published_at)}</p>
                {related.is_watched && (
                  <svg className="w-3 h-3 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Infinite scroll trigger */}
      <div ref={loaderRef} className="mt-4 flex justify-center min-h-[40px]">
        {loadingMore && (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span>Yükleniyor…</span>
          </div>
        )}
        {!hasMore && videos.length > 0 && (
          <p className="text-gray-600 text-xs">Tüm videolar yüklendi</p>
        )}
      </div>
    </div>
  )
}
