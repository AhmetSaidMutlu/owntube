'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, Youtube, LogOut, AlertTriangle, ExternalLink } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [youtubeConnected, setYoutubeConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadUserInfo()
  }, [])

  async function loadUserInfo() {
    try {
      const response = await fetch('/api/youtube-status')
      if (!response.ok) return
      const status = await response.json()
      setEmail(status.email || '')
      setName(status.name || '')
      setAvatarUrl(status.avatarUrl || '')
      setYoutubeConnected(Boolean(status.connected))
    } catch (err) {
      console.error('Error loading user info:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDisconnectYouTube() {
    try {
      setError('')
      const response = await fetch('/api/youtube-disconnect', { method: 'POST' })
      if (!response.ok) throw new Error('Failed to disconnect YouTube')

      setYoutubeConnected(false)
    } catch (err) {
      console.error('Error disconnecting YouTube:', err)
      setError('Failed to disconnect YouTube')
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/logout', { method: 'POST' })
      router.push('/auth/login')
    } catch (err) {
      console.error('Error logging out:', err)
      setError('Failed to logout')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Manage your account and preferences</p>
        </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Account Section */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {avatarUrl && (
            <div className="flex items-center gap-4">
              <img 
                src={avatarUrl} 
                alt="Profile" 
                className="w-16 h-16 rounded-full"
              />
              <div>
                <p className="font-medium">{name || 'User'}</p>
                <p className="text-sm text-muted-foreground">{email}</p>
              </div>
            </div>
          )}
          {!avatarUrl && (
            <div>
              <label className="text-sm font-medium">Email</label>
              <p className="text-sm text-muted-foreground mt-1">{email}</p>
            </div>
          )}
          <Button variant="destructive" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>

      {/* YouTube API Quota */}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
            <AlertTriangle className="w-5 h-5" />
            YouTube API Quota
          </CardTitle>
          <CardDescription className="text-amber-800 dark:text-amber-300">
            Important information about API limits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-amber-900 dark:text-amber-100">
          <div>
            <p className="font-medium mb-2">Current Limits:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Free tier: <strong>10,000 quota units</strong> per day</li>
              <li>Subscriptions: ~2 units per subscription page (~100 subscriptions)</li>
              <li>Videos: ~100 units per channel per page</li>
            </ul>
          </div>
          <div className="p-3 rounded bg-white/50 dark:bg-black/20">
            <p className="font-medium mb-2">If you hit the quota limit:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>The sync will fail with a "quotaExceeded" error</li>
              <li>Wait until the next day for quotas to reset (UTC midnight)</li>
              <li>Alternatively, request quota increase from Google API Console</li>
            </ol>
          </div>
          <Button
            variant="outline"
            className="w-full gap-2 border-amber-400 hover:bg-white/50"
            onClick={() => window.open('https://console.cloud.google.com/apis/dashboard', '_blank')}
          >
            <ExternalLink className="w-4 h-4" />
            Go to Google Cloud Console
          </Button>
        </CardContent>
      </Card>

      {/* YouTube Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Youtube className="w-5 h-5" />
            YouTube Integration
          </CardTitle>
          <CardDescription>Manage your YouTube account connection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : youtubeConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-200">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-medium">YouTube connected</span>
              </div>
              <Button variant="outline" onClick={handleDisconnectYouTube}>
                Disconnect YouTube
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect your YouTube account to access your subscriptions and videos.
              </p>
              <Button
                onClick={() => {
                  window.location.href = '/api/youtube-auth'
                }}
                className="gap-2"
              >
                <Youtube className="w-4 h-4" />
                Connect YouTube
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>About OwnTube</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>OwnTube is a private YouTube subscription manager that lets you browse your video feed with a clean interface.</p>
          <p>Your data is stored securely and never shared with third parties.</p>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
