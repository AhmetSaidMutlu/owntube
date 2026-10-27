'use client'

import { Suspense } from 'react'
import { DashboardContent } from '@/components/dashboard-content'

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
