'use client'

import { motion } from 'framer-motion'
import {
  Flex,
  Text,
  Title,
  Card,
  Metric,
  Badge,
  List,
  ListItem,
  Button,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@tremor/react'
import { Tag, Plus, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const rub = (v: number) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(v)

interface CategoryItem {
  id: string
  name: string
  count: number
  total: number
  color: string
}

const incomeCategories: CategoryItem[] = [
  { id: 'i1', name: 'Выручка', count: 84, total: 12_450_000, color: '#10b981' },
  { id: 'i2', name: 'Консультации', count: 12, total: 1_200_000, color: '#3b82f6' },
  { id: 'i3', name: 'Проектные доходы', count: 6, total: 2_800_000, color: '#8b5cf6' },
  { id: 'i4', name: 'Проценты', count: 3, total: 35_000, color: '#f59e0b' },
  { id: 'i5', name: 'Прочие доходы', count: 2, total: 15_000, color: '#6b7280' },
]

const expenseCategories: CategoryItem[] = [
  { id: 'e1', name: 'Зарплаты', count: 24, total: 2_100_000, color: '#ef4444' },
  { id: 'e2', name: 'Аренда', count: 3, total: 450_000, color: '#f97316' },
  { id: 'e3', name: 'Маркетинг', count: 8, total: 380_000, color: '#eab308' },
  { id: 'e4', name: 'Подписки', count: 6, total: 120_000, color: '#22c55e' },
  { id: 'e5', name: 'Логистика', count: 11, total: 290_000, color: '#06b6d4' },
  { id: 'e6', name: 'Канцтовары', count: 4, total: 18_000, color: '#6366f1' },
  { id: 'e7', name: 'Связь', count: 3, total: 24_000, color: '#a855f7' },
  { id: 'e8', name: 'Страхование', count: 2, total: 85_000, color: '#ec4899' },
  { id: 'e9', name: 'Обучение', count: 2, total: 45_000, color: '#14b8a6' },
  { id: 'e10', name: 'Прочее', count: 7, total: 85_000, color: '#6b7280' },
]

const totalIncome = incomeCategories.reduce((s, c) => s + c.total, 0)
const totalExpense = expenseCategories.reduce((s, c) => s + c.total, 0)

export default function CategoriesPage() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 space-y-6">
      {/* Header */}
      <Flex justifyContent="between" alignItems="center">
        <div>
          <Title>Категории</Title>
          <Text className="text-tremor-content-subtle mt-1">Управление категориями доходов и расходов</Text>
        </div>
      </Flex>

      {/* KPI cards */}
      <Flex className="gap-4">
        <Card className="flex-1">
          <Flex alignItems="center" className="gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <Text className="text-tremor-content-subtle">Доходы</Text>
          </Flex>
          <Metric className="text-success">{rub(totalIncome)}</Metric>
          <Text className="text-tremor-content-subtle text-xs mt-1">{incomeCategories.length} категорий</Text>
        </Card>
        <Card className="flex-1">
          <Flex alignItems="center" className="gap-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
            <Text className="text-tremor-content-subtle">Расходы</Text>
          </Flex>
          <Metric className="text-danger">{rub(totalExpense)}</Metric>
          <Text className="text-tremor-content-subtle text-xs mt-1">{expenseCategories.length} категорий</Text>
        </Card>
      </Flex>

      {/* Tabs */}
      <TabGroup>
        <TabList>
          <Tab>Доходы</Tab>
          <Tab>Расходы</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <Card>
              <Flex justifyContent="between" alignItems="center" className="px-4 pt-4 pb-2">
                <Text className="text-tremor-content font-medium">Категории доходов</Text>
                <Button variant="light" size="xs" icon={Plus}>
                  Добавить
                </Button>
              </Flex>
              <List>
                {incomeCategories.map((cat) => (
                  <CategoryRow key={cat.id} category={cat} />
                ))}
              </List>
            </Card>
          </TabPanel>
          <TabPanel>
            <Card>
              <Flex justifyContent="between" alignItems="center" className="px-4 pt-4 pb-2">
                <Text className="text-tremor-content font-medium">Категории расходов</Text>
                <Button variant="light" size="xs" icon={Plus}>
                  Добавить
                </Button>
              </Flex>
              <List>
                {expenseCategories.map((cat) => (
                  <CategoryRow key={cat.id} category={cat} />
                ))}
              </List>
            </Card>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </motion.div>
  )
}

function CategoryRow({ category }: { category: CategoryItem }) {
  return (
    <ListItem>
      <Flex alignItems="center" justifyContent="between">
        <Flex alignItems="center" className="gap-3">
          <div
            className="h-3 w-3 rounded-full shrink-0"
            style={{ backgroundColor: category.color }}
            aria-hidden
          />
          <Text className="text-tremor-content font-medium">{category.name}</Text>
        </Flex>
        <Flex alignItems="center" className="gap-4">
          <Badge color="gray" size="sm">
            {category.count} оп.
          </Badge>
          <Text className="text-tremor-content tabular-nums font-medium w-36 text-right">
            {rub(category.total)}
          </Text>
        </Flex>
      </Flex>
    </ListItem>
  )
}
