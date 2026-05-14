'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Flex,
  Text,
  Title,
  Card,
  Grid,
  Metric,
  Badge,
  Button,
  ProgressBar,
  Divider,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@tremor/react'
import {
  Plus,
  FolderKanban,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react'
import { formatMoney } from '@/lib/utils'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

type ProjectStatus = 'active' | 'completed' | 'on_hold'

const statusConfig: Record<ProjectStatus, { color: 'emerald' | 'blue' | 'amber'; label: string; icon: React.ElementType }> = {
  active: { color: 'emerald', label: 'Активный', icon: Clock },
  completed: { color: 'blue', label: 'Завершён', icon: CheckCircle2 },
  on_hold: { color: 'amber', label: 'Приостановлен', icon: AlertTriangle },
}

const DEMO_PROJECTS = [
  { id: '1', name: 'Платформа аналитики', client: 'ООО «Альфа»', budget: 2500000, spent: 1750000, status: 'active' as ProjectStatus, margin: 18 },
  { id: '2', name: 'Мобильное приложение', client: 'ПАО «Дельта»', budget: 1800000, spent: 1800000, status: 'completed' as ProjectStatus, margin: 22 },
  { id: '3', name: 'Интеграция CRM', client: 'ООО «Гамма»', budget: 950000, spent: 720000, status: 'active' as ProjectStatus, margin: 15 },
  { id: '4', name: 'Редизайн портала', client: 'ООО «Бета»', budget: 1200000, spent: 600000, status: 'on_hold' as ProjectStatus, margin: 12 },
  { id: '5', name: 'Автоматизация отчётности', client: 'ООО «Вектор»', budget: 3200000, spent: 2100000, status: 'active' as ProjectStatus, margin: 25 },
  { id: '6', name: 'Облачная миграция', client: 'ООО «Омега»', budget: 1500000, spent: 1500000, status: 'completed' as ProjectStatus, margin: 20 },
  { id: '7', name: 'Система мониторинга', client: 'ООО «Сигма»', budget: 800000, spent: 350000, status: 'active' as ProjectStatus, margin: 30 },
  { id: '8', name: 'API-шлюз', client: 'ИП Петров А.С.', budget: 600000, spent: 450000, status: 'on_hold' as ProjectStatus, margin: 8 },
]

const TAB_FILTERS = ['all', 'active', 'completed', 'on_hold'] as const

export default function ProjectsPage() {
  const [tabIndex, setTabIndex] = useState(0)

  const filter = TAB_FILTERS[tabIndex]
  const filtered = filter === 'all' ? DEMO_PROJECTS : DEMO_PROJECTS.filter((p) => p.status === filter)

  const totalBudget = DEMO_PROJECTS.reduce((s, p) => s + p.budget, 0)
  const totalSpent = DEMO_PROJECTS.reduce((s, p) => s + p.spent, 0)
  const avgMargin = Math.round(DEMO_PROJECTS.reduce((s, p) => s + p.margin, 0) / DEMO_PROJECTS.length)

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 space-y-6">
      {/* Header */}
      <Flex justifyContent="between" alignItems="center">
        <Flex flexDirection="col">
          <Title>Проекты</Title>
          <Text className="text-tremor-content-subtle mt-1">Управление проектами и рентабельность</Text>
        </Flex>
        <Button variant="primary" size="sm" icon={Plus}>
          Новый проект
        </Button>
      </Flex>

      {/* KPI Cards */}
      <Grid numItems={1} numItemsSm={3} className="gap-4">
        <Card>
          <Text className="text-tremor-content-subtle">Общий бюджет</Text>
          <Metric>{formatMoney(totalBudget)}</Metric>
        </Card>
        <Card>
          <Text className="text-tremor-content-subtle">Израсходовано</Text>
          <Metric className="text-tremor-content">{formatMoney(totalSpent)}</Metric>
        </Card>
        <Card>
          <Flex alignItems="center" className="gap-2">
            <TrendingUp className="h-4 w-4 text-success" />
            <Text className="text-tremor-content-subtle">Средняя маржа</Text>
          </Flex>
          <Metric className="text-success">{avgMargin}%</Metric>
        </Card>
      </Grid>

      {/* Filter tabs + project grid */}
      <Card>
        <TabGroup index={tabIndex} onIndexChange={setTabIndex}>
          <TabList>
            <Tab>Все</Tab>
            <Tab>Активные</Tab>
            <Tab>Завершённые</Tab>
            <Tab>Приостановленные</Tab>
          </TabList>
          <TabPanels>
            {TAB_FILTERS.map((f) => (
              <TabPanel key={f}>
                <Grid numItems={1} numItemsMd={2} numItemsLg={3} className="gap-4 mt-4">
                  {filtered.map((project, i) => {
                    const cfg = statusConfig[project.status]
                    const Icon = cfg.icon
                    const remaining = project.budget - project.spent
                    const progressPct = Math.round((project.spent / project.budget) * 100)

                    return (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                      >
                        <Card className="h-full">
                          <Flex justifyContent="between" alignItems="start">
                            <Flex alignItems="center" className="gap-2">
                              <div className="h-8 w-8 rounded-lg bg-tremor-background-muted flex items-center justify-center">
                                <FolderKanban className="h-4 w-4 text-tremor-content-subtle" />
                              </div>
                              <Flex flexDirection="col">
                                <Text className="text-tremor-content font-medium">{project.name}</Text>
                                <Text className="text-tremor-content-subtle text-xs">{project.client}</Text>
                              </Flex>
                            </Flex>
                            <Badge size="xs" color={cfg.color}>
                              <Icon className="h-3 w-3 mr-1" />
                              {cfg.label}
                            </Badge>
                          </Flex>

                          <Divider className="my-3" />

                          <Flex flexDirection="col" className="gap-3">
                            <Flex justifyContent="between" alignItems="center">
                              <Text className="text-tremor-content-subtle text-xs">Бюджет</Text>
                              <Text className="text-tremor-content text-sm font-medium tabular-nums">{formatMoney(project.budget)}</Text>
                            </Flex>
                            <Flex justifyContent="between" alignItems="center">
                              <Text className="text-tremor-content-subtle text-xs">Израсходовано</Text>
                              <Text className="text-danger text-sm font-medium tabular-nums">{formatMoney(project.spent)}</Text>
                            </Flex>
                            <Flex justifyContent="between" alignItems="center">
                              <Text className="text-tremor-content-subtle text-xs">Остаток</Text>
                              <Text className="text-success text-sm font-medium tabular-nums">{formatMoney(remaining)}</Text>
                            </Flex>

                            <ProgressBar
                              value={progressPct}
                              color={progressPct > 90 ? 'red' : progressPct > 70 ? 'amber' : 'emerald'}
                              className="mt-2"
                            />
                            <Flex justifyContent="between">
                              <Text className="text-tremor-content-subtle text-xs">{progressPct}% использовано</Text>
                              <Text className="text-tremor-content-subtle text-xs">Маржа: {project.margin}%</Text>
                            </Flex>
                          </Flex>
                        </Card>
                      </motion.div>
                    )
                  })}
                </Grid>
              </TabPanel>
            ))}
          </TabPanels>
        </TabGroup>
      </Card>
    </motion.div>
  )
}
