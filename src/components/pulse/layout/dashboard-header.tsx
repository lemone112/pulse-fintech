'use client'

import { Flex, Text } from '@tremor/react'
import { ChevronRight, Home } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/pulse/layout/theme-toggle'
import { CommandMenuTrigger, CommandMenu } from '@/components/pulse/command-palette'
import { useState } from 'react'

/** Map route segments to Russian breadcrumb labels */
const breadcrumbMap: Record<string, string> = {
  dashboard: 'Рабочий стол',
  analytics: 'Аналитика',
  transactions: 'Операции',
  invoices: 'Счета',
  projects: 'Проекты',
  counterparties: 'Контрагенты',
  approvals: 'Согласование',
  reports: 'Отчёты',
  pnl: 'ПиУ',
  cashflow: 'ДДС',
  'trial-balance': 'Оборотка',
  'balance-sheet': 'Баланс',
  planning: 'Планирование',
  calendar: 'Календарь',
  categories: 'Категории',
  rules: 'Правила',
  ai: 'AI Ассистент',
  settings: 'Настройки',
  profile: 'Профиль',
  connections: 'Подключения',
}

function buildBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  const crumbs: { label: string; href: string }[] = [{ label: 'Pulse', href: '/dashboard' }]

  let path = ''
  for (const seg of segments) {
    path += `/${seg}`
    const label = breadcrumbMap[seg] || seg
    crumbs.push({ label, href: path })
  }

  return crumbs
}

export function DashboardHeader() {
  const pathname = usePathname()
  const [commandOpen, setCommandOpen] = useState(false)
  const crumbs = buildBreadcrumbs(pathname)

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-tremor-border bg-tremor-background/95 backdrop-blur-sm">
        <Flex justifyContent="between" alignItems="center" className="h-14 px-6">
          {/* Breadcrumbs */}
          <Flex alignItems="center" className="gap-1 text-sm">
            <Home className="h-3.5 w-3.5 text-tremor-content-subtle" />
            {crumbs.slice(1).map((crumb, i) => (
              <Flex key={crumb.href} alignItems="center" className="gap-1">
                <ChevronRight className="h-3 w-3 text-tremor-content-subtle" />
                {i === crumbs.length - 2 ? (
                  <Text className="text-sm font-medium text-tremor-content">{crumb.label}</Text>
                ) : (
                  <Text className="text-sm text-tremor-content-subtle">{crumb.label}</Text>
                )}
              </Flex>
            ))}
          </Flex>

          {/* Right side: search + theme */}
          <Flex alignItems="center" className="gap-2">
            <button
              onClick={() => setCommandOpen(true)}
              className="flex items-center gap-2 rounded-tremor-default border border-tremor-border px-3 py-1.5 text-sm text-tremor-content-subtle hover:bg-tremor-background-muted transition-colors"
            >
              <span className="text-xs text-tremor-content-subtle">⌘K</span>
              <span>Поиск...</span>
            </button>
            <ThemeToggle />
          </Flex>
        </Flex>
      </header>

      <CommandMenu open={commandOpen} onClose={() => setCommandOpen(false)} />
    </>
  )
}
