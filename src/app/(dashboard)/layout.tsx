'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Flex } from '@tremor/react'
import { Sidebar } from '@/components/pulse/sidebar'
import { DashboardHeader } from '@/components/pulse/layout/dashboard-header'
import { useKeyboardShortcuts, SHORTCUT_EVENTS } from '@/hooks/use-keyboard-shortcuts'

const NAV_ROUTES = [
  '/dashboard',
  '/analytics',
  '/transactions',
  '/invoices',
  '/projects',
  '/counterparties',
  '/approvals',
  '/reports/cashflow',
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const router = useRouter()

  useKeyboardShortcuts({
    onCommandPalette: useCallback(() => {
      window.dispatchEvent(new CustomEvent(SHORTCUT_EVENTS.commandPalette))
    }, []),
    onNewTransaction: useCallback(() => {
      router.push('/transactions?new=1')
    }, [router]),
    onNewInvoice: useCallback(() => {
      router.push('/invoices?new=1')
    }, [router]),
    onFocusSearch: useCallback(() => {
      window.dispatchEvent(new CustomEvent(SHORTCUT_EVENTS.commandPalette))
    }, []),
    onNavigate: useCallback((index: number) => {
      if (NAV_ROUTES[index]) {
        router.push(NAV_ROUTES[index])
      }
    }, [router]),
    onEscape: useCallback(() => {
      window.dispatchEvent(new CustomEvent(SHORTCUT_EVENTS.closeModals))
    }, []),
  })

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
