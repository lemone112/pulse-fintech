'use client'

import { Flex } from '@tremor/react'
import { Sidebar } from '@/components/pulse/sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Flex className="h-screen bg-tremor-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        {children}
      </main>
    </Flex>
  )
}
