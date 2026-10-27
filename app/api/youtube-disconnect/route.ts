import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { youtubeAccounts } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/neon-auth'

export async function POST() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await db.delete(youtubeAccounts).where(eq(youtubeAccounts.userId, user.id))
  return NextResponse.json({ success: true })
}
