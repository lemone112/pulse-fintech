'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Database,
  Globe,
  Wrench,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { aiConfig } from '@/lib/ai/config'
import { Card, Flex, Text } from '@tremor/react'

const SUGGESTED_PROMPTS = [
  'Какие категории имеют наибольший рост расходов?',
  'Сравни доходы этого месяца с прошлым',
  'Найди аномальные транзакции',
  'Составь прогноз денежных потоков',
  'Покажи топ-5 контрагентов по дебиторке',
  'Рассчитай рентабельность по проектам',
]

const MCP_TOOLS = [
  { name: 'Firecrawl', description: 'Поиск в интернете', connected: true },
  { name: 'Pulse Tools', description: 'Доступ к данным Pulse', connected: true },
  { name: 'Calculator', description: 'Математические расчёты', connected: false },
]

const DATA_CONTEXT = [
  { label: 'Транзакции', count: '1 245', icon: '💳' },
  { label: 'Контрагенты', count: '87', icon: '👥' },
  { label: 'Категории', count: '24', icon: '🏷' },
  { label: 'Проекты', count: '12', icon: '📁' },
  { label: 'Счета', count: '156', icon: '📄' },
]

const RECENT_QUERIES = [
  'Анализ расходов за май',
  'Дебиторская задолженность',
  'Прогноз на Q3',
]

interface ContextPanelProps {
  recentQuery?: string
  onSuggestionClick?: (prompt: string) => void
}

export function ContextPanel({ recentQuery, onSuggestionClick }: ContextPanelProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('data')

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-4 space-y-4">
      <Text className="text-sm font-semibold text-tremor-content">Контекст</Text>

      {/* Data context */}
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
            {DATA_CONTEXT.map((item) => (
              <Flex justifyContent="between" alignItems="center" key={item.label} className="rounded-md px-2 py-1.5 hover:bg-tremor-background-muted transition-colors">
                <Text className="text-sm text-tremor-content flex items-center gap-2">
                  <span>{item.icon}</span>
                  {item.label}
                </Text>
                <Text className="text-xs tabular-nums text-tremor-content-subtle">{item.count}</Text>
              </Flex>
            ))}
          </motion.div>
        )}
      </div>

      {/* MCP Tools */}
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
              <Flex justifyContent="between" alignItems="center" key={tool.name} className="rounded-md px-2 py-1.5 hover:bg-tremor-background-muted transition-colors">
                <div>
                  <Text className="text-sm text-tremor-content">{tool.name}</Text>
                  <Text className="text-xs text-tremor-content-subtle">{tool.description}</Text>
                </div>
                {tool.connected ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <XCircle className="h-4 w-4 text-tremor-content-subtle" />
                )}
              </Flex>
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
              {RECENT_QUERIES.map((query) => (
                <div key={query} className="rounded-md px-2 py-1.5 text-sm text-tremor-content-subtle hover:bg-tremor-background-muted hover:text-tremor-content transition-colors cursor-pointer">
                  {query}
                </div>
              ))}
            </motion.div>
          )}
        </div>
      )}

      {/* Suggested prompts */}
      <div className="space-y-2">
        <Text className="text-xs font-medium text-tremor-content-subtle uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="h-3 w-3" />
          Предложения
        </Text>
        <div className="space-y-1">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => onSuggestionClick?.(prompt)}
              className="block w-full text-left rounded-md px-2 py-1.5 text-sm text-tremor-content-subtle hover:bg-tremor-background-muted hover:text-tremor-content transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* AI Config status */}
      <Card className="space-y-2">
        <Text className="text-xs font-medium text-tremor-content-subtle">Статус AI</Text>
        <Flex alignItems="center" className="gap-2">
          <div className={cn('h-2 w-2 rounded-full', aiConfig.baseUrl ? 'bg-success' : 'bg-tremor-content-subtle')} />
          <Text className="text-xs text-tremor-content">
            {aiConfig.baseUrl ? 'Подключено' : 'Не настроено'}
          </Text>
        </Flex>
        {aiConfig.baseUrl && (
          <Text className="text-xs text-tremor-content-subtle">
            Модель: {aiConfig.models.base}
          </Text>
        )}
      </Card>
    </div>
  )
}
