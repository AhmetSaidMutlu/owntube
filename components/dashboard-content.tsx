'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, Play, Users, Settings, RefreshCw } from 'lucide-react'

export function DashboardContent() {
  const searchParams = useSearchParams()
  const [youtubeConnected, setYoutubeConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [videoCount, setVideoCount] = useState(0)
  const [subscriptionCount, setSubscriptionCount] = useState(0)

  useEffect(() => {
    const connected = searchParams.get('connected') === 'true'
    const authError = searchParams.get('error')

    if (connected) {
      setSuccess('YouTube account connected successfully!')
      syncVideos()
    }

    if (authError) {
      const errorMessages: Record<string, string> = {
        'token_exchange_failed': 'YouTube token exchange failed. Please check your YouTube API credentials.',
        'save_tokens_failed': 'Failed to save YouTube tokens. Please try again.',
        'youtube_auth_failed': 'YouTube authentication failed. Please try again.',
      }
      setError(errorMessages[authError] || 'Failed to connect YouTube account. Please try again.')
    }

    checkYoutubeConnection()
  }, [searchParams])

  async function checkYoutubeConnection() {
    try {
      const response = await fetch('/api/youtube-status')
      if (response.ok) {
        const data = await response.json()
        setYoutubeConnected(data.connected)
        setVideoCount(data.video_count || 0)
        setSubscriptionCount(data.subscription_count || 0)
      }
    } catch (err) {
      console.error('Error checking YouTube connection:', err)
    } finally {
      setLoading(false)
    }
  }

  async function syncVideos() {
    try {
      setSyncing(true)
      setError('')
      setSuccess('')
      console.log('Starting sync...')
      
      const response = await fetch('/api/sync-videos', {
        method: 'POST',
      })

      const data = await response.json()
      console.log('Sync response:', data)

      if (!response.ok) {
        // Check if it's a quota error
        const errorMsg = data.error || ''
        if (errorMsg.includes('quotaExceeded') || errorMsg.includes('quota')) {
          throw new Error('YouTube API quota exceeded. Quotas reset at midnight UTC. Check Settings for more info.')
        }
        throw new Error(errorMsg)
      }

      setVideoCount((prev) => prev + (data.videos_synced || 0))
      setSubscriptionCount(data.subscriptions_count || 0)
      setSuccess(`Synced ${data.subscriptions_count || 0} subscriptions and ${data.videos_synced || 0} new videos!`)
      
      // Refresh counts from database
      setTimeout(() => checkYoutubeConnection(), 1000)
    } catch (err) {
      console.error('Error syncing videos:', err)
      setError(err instanceof Error ? err.message : 'Failed to sync videos')
    } finally {
      setSyncing(false)
    }
  }

  function handleConnectYouTube() {
    window.location.href = '/api/youtube-auth'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {error && (
          <Alert variant="destructive" className="mb-4 sm:mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 sm:mb-6 border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-sm text-green-800 dark:text-green-200">{success}</AlertDescription>
          </Alert>
        )}

      {!youtubeConnected ? (
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Connect Your YouTube</CardTitle>
            <CardDescription>
              Connect your YouTube account to access your subscriptions and videos
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={handleConnectYouTube} size="lg" className="gap-2">
              <Play className="w-5 h-5" />
              Connect YouTube
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground text-sm sm:text-base">Welcome to your private video feed</p>
            </div>
            <Button onClick={syncVideos} disabled={syncing} variant="outline" className="gap-2 w-full sm:w-auto">
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          </div>

          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            <Link href="/videos">
              <Card className="cursor-pointer hover:bg-accent/50 transition-colors h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Videos</CardTitle>
                    <Play className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{videoCount}</p>
                  <p className="text-sm text-muted-foreground">videos in your feed</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/subscriptions">
              <Card className="cursor-pointer hover:bg-accent/50 transition-colors h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Subscriptions</CardTitle>
                    <Users className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{subscriptionCount}</p>
                  <p className="text-sm text-muted-foreground">channels followed</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/settings">
              <Card className="cursor-pointer hover:bg-accent/50 transition-colors h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Settings</CardTitle>
                    <Settings className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {videoCount === 0 && subscriptionCount === 0 ? (
            <Card className="border-dashed border-2">
              <CardHeader className="text-center">
                <CardTitle className="text-lg">Ready to Sync</CardTitle>
                <CardDescription>
                  Your YouTube account is connected. Click the button below to fetch your subscriptions and videos.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button onClick={syncVideos} disabled={syncing} size="lg" className="gap-2">
                  <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Syncing...' : 'Sync My YouTube'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  YouTube Connected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Your YouTube account is connected and syncing.</p>
                  <p>Pull down on the Videos page to refresh your feed.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      </div>
    </div>
  )
}
