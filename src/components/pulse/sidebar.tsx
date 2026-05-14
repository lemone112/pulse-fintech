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
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  type LucideIcon,
} from 'lucide-react'
import { Flex, Text, Divider, Button, Icon } from '@tremor/react'
import { cn } from '@/lib/utils'
import { CommandMenuTrigger, CommandMenu } from '@/components/pulse/command-palette'
import { ThemeToggle } from '@/components/pulse/layout/theme-toggle'
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

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
}

export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname()
  const [commandOpen, setCommandOpen] = useState(false)

  return (
    <>
      <Flex
        flexDirection="col"
        className={cn(
          'h-screen shrink-0 border-r border-tremor-border bg-tremor-background transition-[width] duration-200',
          collapsed ? 'w-[68px]' : 'w-64'
        )}
      >
        {/* Logo */}
        <Flex alignItems="center" justifyContent="between" className="h-16 border-b border-tremor-border px-4">
          <Flex alignItems="center" className="gap-2 overflow-hidden">
            <div
              aria-hidden
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-tremor-brand text-tremor-brand-inverted"
            >
              <span className="text-sm font-semibold">P</span>
            </div>
            {!collapsed && (
              <Text className="text-base font-semibold tracking-tight text-tremor-content whitespace-nowrap">
                Pulse
              </Text>
            )}
          </Flex>
          <Button
            variant="secondary"
            size="xl"
            className="h-7 w-7 p-0 shrink-0"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Развернуть боковую панель' : 'Свернуть боковую панель'}
            title={collapsed ? 'Развернуть' : 'Свернуть'}
          >
            <Icon icon={collapsed ? ChevronsRight : ChevronsLeft} className="h-4 w-4" />
          </Button>
        </Flex>

        {/* Command menu */}
        {!collapsed && (
          <div className="border-b border-tremor-border p-3">
            <CommandMenuTrigger onSelect={() => setCommandOpen(true)} />
          </div>
        )}

        {/* Navigation */}
        <Flex flexDirection="col" className="flex-1 space-y-4 overflow-y-auto px-2 py-3 custom-scrollbar">
          <NavGroup items={primary} pathname={pathname} collapsed={collapsed} />
          <Divider />
          <NavGroup items={reports} pathname={pathname} title="Отчёты" collapsed={collapsed} />
          <Divider />
          <NavGroup items={admin} pathname={pathname} title="Управление" collapsed={collapsed} />
        </Flex>

        {/* Bottom: user avatar + theme toggle */}
        <div className="border-t border-tremor-border p-3">
          <Flex alignItems="center" justifyContent="between" className="gap-2">
            <Flex alignItems="center" className={cn('gap-2 overflow-hidden min-w-0', collapsed && 'justify-center')}>
              {/* User avatar */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tremor-brand-subtle text-tremor-brand text-xs font-semibold">
                АД
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <Text className="text-sm font-medium text-tremor-content truncate">Админ</Text>
                  <Text className="text-xs text-tremor-content-subtle truncate">admin@pulse.ru</Text>
                </div>
              )}
            </Flex>
            {!collapsed && (
              <Flex alignItems="center" className="gap-1 shrink-0">
                <ThemeToggle />
                <Button
                  variant="secondary"
                  size="xl"
                  className="h-7 w-7 p-0"
                  aria-label="Выйти"
                  title="Выйти"
                >
                  <Icon icon={LogOut} className="h-4 w-4" />
                </Button>
              </Flex>
            )}
          </Flex>
        </div>
      </Flex>

      <CommandMenu open={commandOpen} onClose={() => setCommandOpen(false)} />
    </>
  )
}

function NavGroup({
  items,
  pathname,
  title,
  collapsed,
}: {
  items: NavItem[]
  pathname: string
  title?: string
  collapsed: boolean
}) {
  return (
    <div>
      {title && !collapsed && (
        <Text className="mb-1 px-3 text-xs font-medium uppercase tracking-wider text-tremor-content-subtle">
          {title}
        </Text>
      )}
      <div className="space-y-0.5">
        {items.map((item) => {
          const active = isActive(item.href, pathname)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group flex items-center gap-3 rounded-tremor-default px-3 py-2 text-sm transition-colors',
                collapsed && 'justify-center px-0',
                active
                  ? 'bg-tremor-brand-subtle text-tremor-brand font-medium'
                  : 'text-tremor-content-subtle hover:bg-tremor-background-muted hover:text-tremor-content'
              )}
              title={collapsed ? item.name : undefined}
            >
              <Icon
                icon={item.icon}
                className={cn(
                  'h-4 w-4 shrink-0 transition-colors',
                  active
                    ? 'text-tremor-brand'
                    : 'text-tremor-content-subtle group-hover:text-tremor-content'
                )}
              />
              {!collapsed && <Text className="truncate">{item.name}</Text>}
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
