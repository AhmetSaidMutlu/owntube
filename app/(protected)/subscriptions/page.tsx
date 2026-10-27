'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { AlertCircle, RefreshCw, Users, EyeOff } from 'lucide-react'

interface Subscription {
  id: string
  title: string
  thumbnail: string
  is_active: boolean
}

export default function SubscriptionsPage() {
  const router = useRouter()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    loadSubscriptions()
  }, [])

  async function loadSubscriptions() {
    try {
      setLoading(true)
      setError('')
      const response = await fetch('/api/subscriptions')
      if (!response.ok) throw new Error('Failed to load subscriptions')
      const { subscriptions: data } = await response.json()
      setSubscriptions((data || []).map((sub: any) => ({
        id: sub.channelId,
        title: sub.channelTitle,
        thumbnail: sub.channelThumbnail,
        is_active: sub.isActive !== false,
      })))
    } catch {
      setError('Failed to load subscriptions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function toggleSubscription(channelId: string, currentState: boolean) {
    try {
      setTogglingId(channelId)
      const response = await fetch('/api/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId, isActive: !currentState }),
      })
      if (!response.ok) { setError('Failed to update subscription'); return }

      setSubscriptions(subs =>
        subs.map(sub => sub.id === channelId ? { ...sub, is_active: !currentState } : sub)
      )
    } catch {
      setError('Failed to update subscription')
    } finally {
      setTogglingId(null)
    }
  }

  async function syncSubscriptions() {
    try {
      setSyncing(true)
      setError('')
      const response = await fetch('/api/sync-videos', { method: 'POST' })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to sync')
      }
      await loadSubscriptions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync subscriptions')
    } finally {
      setSyncing(false)
    }
  }

  const activeCount = subscriptions.filter(s => s.is_active).length

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-semibold">Subscriptions</h1>
            <p className="text-muted-foreground text-xs mt-0.5">
              {activeCount} of {subscriptions.length} channels active
            </p>
          </div>
          <Button
            onClick={syncSubscriptions}
            disabled={syncing}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync'}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          /* Skeleton */
          <div className="grid gap-2 grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-muted" />
                <div className="h-2.5 bg-muted rounded w-14" />
              </div>
            ))}
          </div>
        ) : subscriptions.length === 0 ? (
          <Empty>
            <EmptyMedia variant="icon"><Users className="size-6" /></EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No subscriptions yet</EmptyTitle>
              <EmptyDescription>Click Sync to import your YouTube subscriptions.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          /*
           * Grid of compact channel pills:
           * avatar (rounded) + channel name below
           * tap avatar → /channel/[id]
           * tap EyeOff → toggle active
           */
          <div className="grid gap-x-3 gap-y-4 grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className={`flex flex-col items-center gap-1.5 ${!sub.is_active ? 'opacity-40' : ''}`}
              >
                {/* Avatar — tappable, goes to channel page */}
                <div className="relative group/avatar">
                  <button
                    onClick={() => router.push(`/channel/${sub.id}`)}
                    className="w-12 h-12 rounded-full overflow-hidden bg-muted flex items-center justify-center hover:ring-2 hover:ring-primary transition-all"
                    aria-label={`Open ${sub.title}`}
                  >
                    {sub.thumbnail ? (
                      <img
                        src={sub.thumbnail}
                        alt={sub.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium text-muted-foreground">
                        {sub.title.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </button>

                  {/* Toggle visibility — small badge on avatar */}
                  <button
                    onClick={() => toggleSubscription(sub.id, sub.is_active)}
                    disabled={togglingId === sub.id}
                    className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-background border border-border flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity disabled:opacity-50"
                    aria-label={sub.is_active ? 'Hide channel' : 'Show channel'}
                  >
                    <EyeOff className="w-2.5 h-2.5 text-muted-foreground" />
                  </button>
                </div>

                {/* Channel name */}
                <button
                  onClick={() => router.push(`/channel/${sub.id}`)}
                  className="text-[10px] text-center text-muted-foreground hover:text-foreground transition-colors line-clamp-2 leading-tight w-full"
                >
                  {sub.title}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
