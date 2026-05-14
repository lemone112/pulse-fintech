'use client'

import { useState } from 'react'
import { Flex } from '@tremor/react'
import { Sidebar } from '@/components/pulse/sidebar'
import { DashboardHeader } from '@/components/pulse/layout/dashboard-header'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <Flex className="h-screen bg-tremor-background">
      {/* Sidebar — fixed width, full height */}
      <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />

      {/* Main area — header + content */}
      <Flex flexDirection="col" className="flex-1 min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </main>
      </Flex>
    </Flex>
  )
}
