import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function AuthError({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const error = searchParams.error || 'An authentication error occurred'

  return (
    <Card className="border-destructive">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <CardTitle>Authentication Error</CardTitle>
        </div>
        <CardDescription>
          Something went wrong during authentication
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {error}
        </p>
        <div className="flex flex-col gap-2">
          <Link href="/auth/login">
            <Button className="w-full">
              Back to Login
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button variant="outline" className="w-full">
              Create Account
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
