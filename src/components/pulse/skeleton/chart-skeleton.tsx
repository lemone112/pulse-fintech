'use client'

import { Card, Flex, Title } from '@tremor/react'

/** Chart skeleton — rectangular shimmer area with optional title bar */
export function ChartSkeleton({ title }: { title?: string }) {
  return (
    <Card>
      {title ? (
        <Title className="text-tremor-content-subtle text-sm font-medium">{title}</Title>
      ) : (
        <div className="skeleton-shimmer h-4 w-32 rounded" />
      )}
      <div className="skeleton-shimmer h-56 w-full rounded mt-4" />
    </Card>
  )
}

/** Side-by-side chart skeleton row */
export function ChartRowSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartSkeleton />
      <ChartSkeleton />
    </div>
  )
}
