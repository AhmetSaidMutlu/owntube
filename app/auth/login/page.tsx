'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleGoogleLogin() {
    setLoading(true)
    setError('')
    const result = await authClient.signIn.social({ provider: 'google', callbackURL: '/dashboard' })
    if (result.error) {
      setError('Unable to sign in with Google.')
      setLoading(false)
    }
  }

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const result = await authClient.signIn.email({ email, password })
    if (result.error) setError('Unable to sign in with these credentials.')
    else { router.push('/dashboard'); router.refresh() }
    setLoading(false)
  }

  return <div className="flex items-center justify-center min-h-screen bg-background"><Card className="w-full max-w-md mx-4"><CardHeader className="text-center"><CardTitle className="text-3xl font-bold">OwnTube</CardTitle><CardDescription>Your private YouTube subscription feed</CardDescription></CardHeader><CardContent><div className="space-y-3"><Button type="button" variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={loading}>Continue with Google</Button><div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" /><span>or</span><span className="h-px flex-1 bg-border" /></div></div><form onSubmit={handleLogin} className="space-y-4">{error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}<input className="w-full rounded-md border bg-background px-3 py-2" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required /><input className="w-full rounded-md border bg-background px-3 py-2" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required /><Button className="w-full" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</Button></form></CardContent></Card></div>
}
