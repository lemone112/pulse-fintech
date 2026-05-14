'use client'

import { Card, Flex } from '@tremor/react'

/** Single KPI card skeleton */
export function KpiSkeleton() {
  return (
    <Card className="h-full">
      <Flex justifyContent="between" alignItems="center">
        <div className="skeleton-shimmer h-3 w-20 rounded" />
        <div className="skeleton-shimmer h-5 w-5 rounded-full" />
      </Flex>
      <div className="skeleton-shimmer h-8 w-32 rounded mt-3" />
      <Flex alignItems="center" className="mt-2 gap-1.5">
        <div className="skeleton-shimmer h-3 w-12 rounded" />
        <div className="skeleton-shimmer h-3 w-24 rounded" />
      </Flex>
    </Card>
  )
}

/** KPI grid skeleton (4 cards by default) */
export function KpiGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <KpiSkeleton key={i} />
      ))}
    </div>
  )
}
