'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { formatTimeAgo } from '@/lib/youtube'

interface VideoCardProps {
  id: string
  title: string
  description: string
  thumbnail: string
  channelTitle: string
  channelThumbnail?: string
  channelId?: string
  publishedAt: string
  videoUrl: string
  isWatched?: boolean
}

export function VideoCard({
  id,
  title,
  thumbnail,
  channelTitle,
  channelThumbnail,
  channelId,
  publishedAt,
  videoUrl,
  isWatched,
}: VideoCardProps) {
  const router = useRouter()

  const videoId = videoUrl.includes('v=')
    ? videoUrl.split('v=')[1]?.split('&')[0]
    : id

  function handleChannelClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (channelId) {
      router.push(`/channel/${channelId}`)
    }
  }

  return (
    <button
      onClick={() => router.push(`/watch/${videoId}`)}
      className="w-full text-left group"
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted group">
        <Image
          src={thumbnail}
          alt={title}
          fill
          className={`object-cover group-hover:scale-105 transition-transform duration-200 ${isWatched ? 'opacity-50' : ''}`}
        />
        {/* Watched indicator */}
        {isWatched && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-xs text-white font-medium">Watched</span>
            </div>
          </div>
        )}
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-xs font-medium">
          --:--
        </div>
      </div>

      {/* Video Info */}
      <div className="flex gap-3 mt-3">
        {/* Channel Avatar */}
        <button
          onClick={handleChannelClick}
          className="w-9 h-9 rounded-full shrink-0 overflow-hidden bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground hover:opacity-80 transition-opacity"
          aria-label={`Go to ${channelTitle}`}
        >
          {channelThumbnail ? (
            <Image
              src={channelThumbnail}
              alt={channelTitle}
              width={36}
              height={36}
              className="object-cover w-full h-full"
            />
          ) : (
            channelTitle.charAt(0).toUpperCase()
          )}
        </button>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm leading-snug line-clamp-2 group-hover:text-foreground/80">
            {title}
          </h3>
          <button
            onClick={handleChannelClick}
            className="text-xs text-muted-foreground mt-1 truncate block hover:text-foreground transition-colors"
          >
            {channelTitle}
          </button>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-xs text-muted-foreground">
              {formatTimeAgo(publishedAt)}
            </p>
            {isWatched && (
              <svg className="w-3 h-3 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}