'use client'

import { motion } from 'framer-motion'
import {
  Flex,
  Text,
  Title,
  Card,
  Grid,
  Metric,
  Badge,
  Switch,
  Button,
  Divider,
} from '@tremor/react'
import { Zap, Plus, ArrowRight, Filter, MousePointerClick } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

type ActionType = 'categorize' | 'autoapprove' | 'notify'
type ConditionType = 'category' | 'amount' | 'counterparty'

interface AutomationRule {
  id: string
  name: string
  conditionType: ConditionType
  conditionLabel: string
  conditionValue: string
  actionType: ActionType
  actionLabel: string
  actionValue?: string
  active: boolean
  matchCount: number
}

const initialRules: AutomationRule[] = [
  {
    id: 'r1',
    name: 'Маркетинг → Автосогласование',
    conditionType: 'category',
    conditionLabel: 'Если категория',
    conditionValue: 'Маркетинг',
    actionType: 'autoapprove',
    actionLabel: 'Автосогласование',
    active: true,
    matchCount: 47,
  },
  {
    id: 'r2',
    name: 'Крупные суммы → Уведомить',
    conditionType: 'amount',
    conditionLabel: 'Если сумма >',
    conditionValue: '500 000 ₽',
    actionType: 'notify',
    actionLabel: 'Уведомить',
    active: true,
    matchCount: 12,
  },
  {
    id: 'r3',
    name: 'ООО «ТехноСнаб» → Логистика',
    conditionType: 'counterparty',
    conditionLabel: 'Если контрагент',
    conditionValue: 'ООО «ТехноСнаб»',
    actionType: 'categorize',
    actionLabel: 'Установить категорию →',
    actionValue: 'Логистика',
    active: true,
    matchCount: 23,
  },
  {
    id: 'r4',
    name: 'Подписки → Автосогласование',
    conditionType: 'category',
    conditionLabel: 'Если категория',
    conditionValue: 'Подписки',
    actionType: 'autoapprove',
    actionLabel: 'Автосогласование',
    active: true,
    matchCount: 31,
  },
  {
    id: 'r5',
    name: 'ИП Сидоров → Аренда',
    conditionType: 'counterparty',
    conditionLabel: 'Если контрагент',
    conditionValue: 'ИП Сидоров',
    actionType: 'categorize',
    actionLabel: 'Установить категорию →',
    actionValue: 'Аренда',
    active: true,
    matchCount: 6,
  },
  {
    id: 'r6',
    name: 'Канцтовары → Автосогласование',
    conditionType: 'category',
    conditionLabel: 'Если категория',
    conditionValue: 'Канцтовары',
    actionType: 'autoapprove',
    actionLabel: 'Автосогласование',
    active: false,
    matchCount: 8,
  },
  {
    id: 'r7',
    name: 'Сумма > 100 000 → Уведомить',
    conditionType: 'amount',
    conditionLabel: 'Если сумма >',
    conditionValue: '100 000 ₽',
    actionType: 'notify',
    actionLabel: 'Уведомить',
    active: false,
    matchCount: 45,
  },
  {
    id: 'r8',
    name: '«КлаудСервис» → Подписки',
    conditionType: 'counterparty',
    conditionLabel: 'Если контрагент',
    conditionValue: 'ООО «КлаудСервис»',
    actionType: 'categorize',
    actionLabel: 'Установить категорию →',
    actionValue: 'Подписки',
    active: true,
    matchCount: 15,
  },
]

const actionColors: Record<ActionType, { badge: 'emerald' | 'blue' | 'amber'; label: string }> = {
  categorize: { badge: 'blue', label: 'Категория' },
  autoapprove: { badge: 'emerald', label: 'Авто' },
  notify: { badge: 'amber', label: 'Уведомление' },
}

const conditionIcons: Record<ConditionType, typeof Filter> = {
  category: Filter,
  amount: MousePointerClick,
  counterparty: Filter,
}

export default function RulesPage() {
  const [rules, setRules] = useState(initialRules)

  const activeRules = rules.filter((r) => r.active).length
  const totalMatches = rules.reduce((s, r) => s + r.matchCount, 0)

  const toggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r))
    )
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 space-y-6">
      {/* Header */}
      <Flex justifyContent="between" alignItems="center">
        <div>
          <Title>Правила автоматизации</Title>
          <Text className="text-tremor-content-subtle mt-1">Автоматическая классификация и согласование операций</Text>
        </div>
        <Button variant="primary" size="sm" icon={Plus}>
          Правило
        </Button>
      </Flex>

      {/* KPI cards */}
      <Grid numItems={1} numItemsSm={2} className="gap-4">
        <Card>
          <Flex alignItems="center" className="gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <Text className="text-tremor-content-subtle">Активных правил</Text>
          </Flex>
          <Metric>{activeRules}</Metric>
          <Text className="text-tremor-content-subtle text-xs mt-1">из {rules.length} всего</Text>
        </Card>
        <Card>
          <Flex alignItems="center" className="gap-2">
            <MousePointerClick className="h-4 w-4 text-blue-500" />
            <Text className="text-tremor-content-subtle">Срабатываний за 30 дней</Text>
          </Flex>
          <Metric>{totalMatches}</Metric>
        </Card>
      </Grid>

      {/* Rules list */}
      <div className="space-y-3">
        {rules.map((rule, index) => {
          const actionConfig = actionColors[rule.actionType]
          const ConditionIcon = conditionIcons[rule.conditionType]
          return (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <Card className={cn(!rule.active && 'opacity-60')}>
                <Flex alignItems="center" justifyContent="between">
                  <Flex alignItems="center" className="gap-4">
                    {/* Condition */}
                    <Flex alignItems="center" className="gap-2">
                      <ConditionIcon className="h-4 w-4 text-tremor-content-subtle shrink-0" />
                      <div>
                        <Text className="text-tremor-content text-xs text-tremor-content-subtle">
                          {rule.conditionLabel}
                        </Text>
                        <Text className="text-tremor-content font-medium text-sm">
                          {rule.conditionValue}
                        </Text>
                      </div>
                    </Flex>

                    <ArrowRight className="h-4 w-4 text-tremor-content-subtle shrink-0" />

                    {/* Action */}
                    <Flex alignItems="center" className="gap-2">
                      <div>
                        <Text className="text-tremor-content text-xs text-tremor-content-subtle">
                          {rule.actionLabel}
                        </Text>
                        {rule.actionValue && (
                          <Text className="text-tremor-content font-medium text-sm">
                            {rule.actionValue}
                          </Text>
                        )}
                      </div>
                      <Badge color={actionConfig.badge} size="sm">
                        {actionConfig.label}
                      </Badge>
                    </Flex>
                  </Flex>

                  <Flex alignItems="center" className="gap-4">
                    {/* Match count */}
                    <Flex alignItems="center" className="gap-1">
                      <Text className="text-tremor-content-subtle text-xs">Срабатываний:</Text>
                      <Text className="text-tremor-content tabular-nums font-medium text-sm">
                        {rule.matchCount}
                      </Text>
                    </Flex>

                    <Divider className="!w-px !h-6" />

                    {/* Toggle */}
                    <Switch
                      checked={rule.active}
                      onChange={() => toggleRule(rule.id)}
                    />
                  </Flex>
                </Flex>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
