'use client'

import { Flex } from '@tremor/react'
import { KpiGridSkeleton } from './kpi-skeleton'
import { ChartRowSkeleton } from './chart-skeleton'
import { TableSkeleton } from './table-skeleton'

/** Full dashboard page skeleton */
export function DashboardPageSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <Flex flexDirection="col">
        <div className="skeleton-shimmer h-7 w-40 rounded" />
        <div className="skeleton-shimmer h-4 w-64 rounded mt-2" />
      </Flex>

      {/* KPI cards */}
      <KpiGridSkeleton />

      {/* Charts row */}
      <ChartRowSkeleton />

      {/* Recent transactions table */}
      <TableSkeleton rows={5} columns={3} showSearch={false} />
    </div>
  )
}

/** Transactions page skeleton */
export function TransactionsPageSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <Flex justifyContent="between" alignItems="center">
        <Flex flexDirection="col">
          <div className="skeleton-shimmer h-7 w-32 rounded" />
          <div className="skeleton-shimmer h-4 w-56 rounded mt-2" />
        </Flex>
        <Flex className="gap-2">
          <div className="skeleton-shimmer h-8 w-20 rounded" />
          <div className="skeleton-shimmer h-8 w-28 rounded" />
        </Flex>
      </Flex>

      {/* KPI cards */}
      <KpiGridSkeleton count={3} />

      {/* Table */}
      <TableSkeleton rows={8} columns={6} showSearch={true} />
    </div>
  )
}

/** Generic page skeleton with header, KPI row, and table */
export function PageSkeleton({ title, subtitle }: { title?: string; subtitle?: string }) {
  return (
    <div className="p-6 space-y-6">
      {/* Header skeleton */}
      <Flex flexDirection="col">
        <div className="skeleton-shimmer h-7 w-48 rounded" />
        <div className="skeleton-shimmer h-4 w-72 rounded mt-2" />
      </Flex>

      {/* KPI cards */}
      <KpiGridSkeleton count={3} />

      {/* Content area */}
      <TableSkeleton />
    </div>
  )
}
