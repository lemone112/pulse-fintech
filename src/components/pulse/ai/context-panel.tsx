'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Database,
  Wrench,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { aiConfig } from '@/lib/ai/config'
import { Card, Flex, Text } from '@tremor/react'

// Suggested prompts that actually work with the PULSE system
const SUGGESTED_PROMPTS = [
  {
    label: 'Анализ расходов по категориям',
    prompt: 'Покажи расходы по категориям за текущий месяц и сравни с предыдущим',
  },
  {
    label: 'Просроченные счета',
    prompt: 'Найди все просроченные счета и посчитай общую сумму дебиторской задолженности',
  },
  {
    label: 'Денежный поток',
    prompt: 'Составь прогноз денежных потоков на следующий квартал на основе текущих данных',
  },
  {
    label: 'Рентабельность проектов',
    prompt: 'Рассчитай рентабельность по каждому проекту и выдели самые прибыльные',
  },
  {
    label: 'Аномальные транзакции',
    prompt: 'Найди аномальные транзакции — суммы, значительно отличающиеся от среднего по категории',
  },
  {
    label: 'Бюджет vs Факт',
    prompt: 'Сравни плановые и фактические показатели по статьям бюджета за текущий период',
  },
]

// MCP tools — placeholder for Model Context Protocol integration
const MCP_TOOLS = [
  {
    name: 'Pulse Data',
    description: 'Доступ к транзакциям, счетам и отчётам',
    connected: true,
    tools: ['list_transactions', 'get_invoice', 'get_report', 'list_categories'],
  },
  {
    name: 'Калькулятор',
    description: 'Математические расчёты и формулы',
    connected: true,
    tools: ['calculate', 'convert_currency'],
  },
  {
    name: 'Внешние данные',
    description: 'Курсы валют, налоговые ставки',
    connected: false,
    tools: ['get_exchange_rate', 'get_tax_rates'],
  },
]

interface DataContextItem {
  label: string
  count: number | null
  icon: string
  loading: boolean
}

interface ContextPanelProps {
  recentQuery?: string
  onSuggestionClick?: (prompt: string) => void
}

export function ContextPanel({ recentQuery, onSuggestionClick }: ContextPanelProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('data')

  // Data context — loaded from API instead of hardcoded
  const [dataContext, setDataContext] = useState<DataContextItem[]>([
    { label: 'Транзакции', count: null, icon: '💳', loading: true },
    { label: 'Контрагенты', count: null, icon: '👥', loading: true },
    { label: 'Категории', count: null, icon: '🏷', loading: true },
    { label: 'Проекты', count: null, icon: '📁', loading: true },
    { label: 'Счета', count: null, icon: '📄', loading: true },
  ])

  // Fetch real counts from the API
  useEffect(() => {
    let cancelled = false

    async function fetchCounts() {
      try {
        const [transactions, counterparties, categories, projects, invoices] = await Promise.allSettled([
          fetch('/api/transactions?limit=1').then(r => r.json()).then(d => d.meta?.total ?? d.data?.length ?? 0),
          fetch('/api/counterparties?limit=1').then(r => r.json()).then(d => d.meta?.total ?? d.data?.length ?? 0),
          fetch('/api/categories?limit=1').then(r => r.json()).then(d => d.meta?.total ?? d.data?.length ?? 0),
          fetch('/api/projects?limit=1').then(r => r.json()).then(d => d.meta?.total ?? d.data?.length ?? 0),
          fetch('/api/invoices?limit=1').then(r => r.json()).then(d => d.meta?.total ?? d.data?.length ?? 0),
        ])

        if (cancelled) return

        const counts = [transactions, counterparties, categories, projects, invoices].map(
          (result) => result.status === 'fulfilled' ? result.value : 0
        )

        setDataContext((prev) =>
          prev.map((item, i) => ({
            ...item,
            count: counts[i],
            loading: false,
          }))
        )
      } catch {
        if (!cancelled) {
          setDataContext((prev) =>
            prev.map((item) => ({ ...item, loading: false, count: 0 }))
          )
        }
      }
    }

    fetchCounts()
    return () => { cancelled = true }
  }, [])

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const formatCount = (count: number | null, loading: boolean): string => {
    if (loading) return '...'
    if (count === null) return '—'
    return count.toLocaleString('ru-RU')
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-4 space-y-4">
      <Flex justifyContent="between" alignItems="center">
        <Text className="text-sm font-semibold text-tremor-content">Контекст</Text>
        <button
          onClick={() => {
            setDataContext((prev) => prev.map((item) => ({ ...item, loading: true })))
            // Re-trigger fetch
            window.dispatchEvent(new CustomEvent('refresh-context'))
          }}
          className="text-tremor-content-subtle hover:text-tremor-content transition-colors"
          title="Обновить данные"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      </Flex>

      {/* Data context — dynamic counts from API */}
      <div className="space-y-1">
        <button
          onClick={() => toggleSection('data')}
          className="flex items-center justify-between w-full text-xs font-medium text-tremor-content-subtle uppercase tracking-wider py-1"
        >
          <span className="flex items-center gap-1.5">
            <Database className="h-3 w-3" />
            Данные
          </span>
          <ChevronRight className={cn('h-3 w-3 transition-transform', expandedSection === 'data' && 'rotate-90')} />
        </button>
        {expandedSection === 'data' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="space-y-1.5 pl-1"
          >
            {dataContext.map((item) => (
              <Flex justifyContent="between" alignItems="center" key={item.label} className="rounded-md px-2 py-1.5 hover:bg-tremor-background-muted transition-colors">
                <Text className="text-sm text-tremor-content flex items-center gap-2">
                  <span>{item.icon}</span>
                  {item.label}
                </Text>
                <Text className={cn(
                  'text-xs tabular-nums',
                  item.loading ? 'text-tremor-content-subtle animate-pulse' : 'text-tremor-content-subtle'
                )}>
                  {formatCount(item.count, item.loading)}
                </Text>
              </Flex>
            ))}
          </motion.div>
        )}
      </div>

      {/* MCP Tools — Model Context Protocol integration */}
      <div className="space-y-1">
        <button
          onClick={() => toggleSection('tools')}
          className="flex items-center justify-between w-full text-xs font-medium text-tremor-content-subtle uppercase tracking-wider py-1"
        >
          <span className="flex items-center gap-1.5">
            <Wrench className="h-3 w-3" />
            MCP Инструменты
          </span>
          <ChevronRight className={cn('h-3 w-3 transition-transform', expandedSection === 'tools' && 'rotate-90')} />
        </button>
        {expandedSection === 'tools' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="space-y-1.5 pl-1"
          >
            {MCP_TOOLS.map((tool) => (
              <div key={tool.name} className="rounded-md px-2 py-1.5 hover:bg-tremor-background-muted transition-colors">
                <Flex justifyContent="between" alignItems="center">
                  <div>
                    <Text className="text-sm text-tremor-content">{tool.name}</Text>
                    <Text className="text-xs text-tremor-content-subtle">{tool.description}</Text>
                  </div>
                  {tool.connected ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-tremor-content-subtle" />
                  )}
                </Flex>
                {tool.connected && tool.tools.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {tool.tools.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center rounded-full bg-tremor-background-muted px-2 py-0.5 text-[10px] text-tremor-content-subtle"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Recent queries */}
      {recentQuery && (
        <div className="space-y-1">
          <button
            onClick={() => toggleSection('recent')}
            className="flex items-center justify-between w-full text-xs font-medium text-tremor-content-subtle uppercase tracking-wider py-1"
          >
            <span className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              Последние запросы
            </span>
            <ChevronRight className={cn('h-3 w-3 transition-transform', expandedSection === 'recent' && 'rotate-90')} />
          </button>
          {expandedSection === 'recent' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="space-y-1 pl-1"
            >
              <div className="rounded-md px-2 py-1.5 text-sm text-tremor-content-subtle hover:bg-tremor-background-muted hover:text-tremor-content transition-colors cursor-pointer">
                {recentQuery}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Suggested prompts — with descriptive labels */}
      <div className="space-y-2">
        <Text className="text-xs font-medium text-tremor-content-subtle uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="h-3 w-3" />
          Предложения
        </Text>
        <div className="space-y-1">
          {SUGGESTED_PROMPTS.map((suggestion) => (
            <button
              key={suggestion.label}
              onClick={() => onSuggestionClick?.(suggestion.prompt)}
              className="block w-full text-left rounded-md px-2 py-1.5 hover:bg-tremor-background-muted transition-colors group"
            >
              <Text className="text-sm text-tremor-content group-hover:text-tremor-content-emphasis transition-colors">
                {suggestion.label}
              </Text>
              <Text className="text-xs text-tremor-content-subtle line-clamp-1">
                {suggestion.prompt}
              </Text>
            </button>
          ))}
        </div>
      </div>

      {/* AI Config status */}
      <Card className="space-y-2">
        <Text className="text-xs font-medium text-tremor-content-subtle">Статус AI</Text>
        <Flex alignItems="center" className="gap-2">
          <div className={cn('h-2 w-2 rounded-full', aiConfig.baseUrl ? 'bg-emerald-500' : 'bg-tremor-content-subtle')} />
          <Text className="text-xs text-tremor-content">
            {aiConfig.baseUrl ? 'Подключено' : 'Не настроено'}
          </Text>
        </Flex>
        {aiConfig.baseUrl && (
          <div className="space-y-0.5">
            <Text className="text-xs text-tremor-content-subtle">
              Быстрая: {aiConfig.models.cheap}
            </Text>
            <Text className="text-xs text-tremor-content-subtle">
              Базовая: {aiConfig.models.base}
            </Text>
            <Text className="text-xs text-tremor-content-subtle">
              Продвинутая: {aiConfig.models.frontier}
            </Text>
          </div>
        )}
      </Card>
    </div>
  )
}
