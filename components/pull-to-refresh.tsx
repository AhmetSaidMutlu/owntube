'use client'

import { useEffect, useRef, useState } from 'react'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  isRefreshing?: boolean
  children: React.ReactNode
}

export function PullToRefresh({ onRefresh, isRefreshing: externalRefreshing, children }: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [internalRefreshing, setInternalRefreshing] = useState(false)
  
  const isRefreshing = externalRefreshing ?? internalRefreshing
  const startYRef = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const REFRESH_THRESHOLD = 80

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    function handleTouchStart(e: TouchEvent) {
      // Only handle pull-down when at the top of the page
      if (window.scrollY === 0) {
        startYRef.current = e.touches[0].clientY
        setIsPulling(true)
      }
    }

    function handleTouchMove(e: TouchEvent) {
      if (!isPulling) return

      const currentY = e.touches[0].clientY
      const diff = currentY - startYRef.current

      if (diff > 0) {
        setPullDistance(Math.min(diff, REFRESH_THRESHOLD + 40))
      } else {
        setIsPulling(false)
        setPullDistance(0)
      }
    }

    async function handleTouchEnd() {
      if (pullDistance >= REFRESH_THRESHOLD && !isRefreshing) {
        setInternalRefreshing(true)
        try {
          await onRefresh()
        } finally {
          setInternalRefreshing(false)
        }
      }

      setPullDistance(0)
      setIsPulling(false)
    }

    container.addEventListener('touchstart', handleTouchStart)
    container.addEventListener('touchmove', handleTouchMove, { passive: true })
    container.addEventListener('touchend', handleTouchEnd)

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isPulling, pullDistance, isRefreshing, onRefresh])

  const progress = Math.min(pullDistance / REFRESH_THRESHOLD, 1)

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-all duration-200"
        style={{
          height: pullDistance,
          opacity: progress,
        }}
      >
        <div className="text-center">
          <div
            className="transform transition-transform"
            style={{
              transform: `rotate(${progress * 180}deg)`,
            }}
          >
            ↓
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isRefreshing ? 'Refreshing...' : 'Pull to refresh'}
          </p>
        </div>
      </div>

      {/* Main content */}
      <div>{children}</div>
    </div>
  )
}
