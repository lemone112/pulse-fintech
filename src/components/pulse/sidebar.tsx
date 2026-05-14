'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Receipt,
  FolderKanban,
  Users,
  ThumbsUp,
  TrendingUp,
  Calendar,
  Tag,
  Settings,
  Zap,
  FileText,
  BookOpen,
  Scale,
  BarChart3,
  Bot,
  type LucideIcon,
} from 'lucide-react'
import { Flex, Text, Divider } from '@tremor/react'
import { cn } from '@/lib/utils'
import { CommandMenuTrigger, CommandMenu } from '@/components/pulse/command-palette'
import { useState } from 'react'

interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  badge?: string
}

const primary: NavItem[] = [
  { name: 'Рабочий стол', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Аналитика', href: '/analytics', icon: BarChart3 },
  { name: 'Операции', href: '/transactions', icon: Receipt },
  { name: 'Счета', href: '/invoices', icon: FileText },
  { name: 'Проекты', href: '/projects', icon: FolderKanban },
  { name: 'Контрагенты', href: '/counterparties', icon: Users },
  { name: 'Согласование', href: '/approvals', icon: ThumbsUp },
]

const reports: NavItem[] = [
  { name: 'ДДС', href: '/reports/cashflow', icon: TrendingUp },
  { name: 'ПиУ', href: '/reports/pnl', icon: TrendingUp },
  { name: 'Оборотка', href: '/reports/trial-balance', icon: BookOpen },
  { name: 'Баланс', href: '/reports/balance-sheet', icon: Scale },
  { name: 'Календарь', href: '/planning/calendar', icon: Calendar },
]

const admin: NavItem[] = [
  { name: 'Категории', href: '/categories', icon: Tag },
  { name: 'Правила', href: '/rules', icon: Zap },
  { name: 'AI Ассистент', href: '/ai', icon: Bot },
  { name: 'Настройки', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [commandOpen, setCommandOpen] = useState(false)

  return (
    <>
      <Flex flexDirection="col" className="h-screen w-64 shrink-0 border-r border-tremor-border bg-tremor-background">
        {/* Logo */}
        <Flex alignItems="center" className="h-16 gap-2 border-b border-tremor-border px-5">
          <div
            aria-hidden
            className="flex h-7 w-7 items-center justify-center rounded-md bg-tremor-brand text-tremor-brand-inverted"
          >
            <span className="text-sm font-semibold">P</span>
          </div>
          <Text className="text-base font-semibold tracking-tight text-tremor-content">
            Pulse
          </Text>
        </Flex>

        {/* Command menu */}
        <div className="border-b border-tremor-border p-3">
          <CommandMenuTrigger onSelect={() => setCommandOpen(true)} />
        </div>

        {/* Navigation */}
        <Flex flexDirection="col" className="flex-1 space-y-6 overflow-y-auto px-3 py-4 custom-scrollbar">
          <NavGroup items={primary} pathname={pathname} />
          <NavGroup items={reports} pathname={pathname} title="Отчёты" />
          <NavGroup items={admin} pathname={pathname} title="Управление" />
        </Flex>
      </Flex>

      <CommandMenu open={commandOpen} onClose={() => setCommandOpen(false)} />
    </>
  )
}

function NavGroup({
  items,
  pathname,
  title,
}: {
  items: NavItem[]
  pathname: string
  title?: string
}) {
  return (
    <div>
      {title && (
        <Text className="mb-1 px-3 text-xs font-medium uppercase tracking-wider text-tremor-content-subtle">
          {title}
        </Text>
      )}
      <div className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href, pathname)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-tremor-brand-subtle text-tremor-brand font-medium'
                  : 'text-tremor-content-subtle hover:bg-tremor-background-muted hover:text-tremor-content'
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0 transition-colors',
                  active
                    ? 'text-tremor-brand'
                    : 'text-tremor-content-subtle group-hover:text-tremor-content'
                )}
              />
              <Text className="truncate">{item.name}</Text>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function isActive(href: string, pathname: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}
