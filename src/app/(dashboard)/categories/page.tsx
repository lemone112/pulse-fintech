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
import { cn, formatMoney } from '@/lib/utils'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

interface CategoryItem {
  id: string
  name: string
  count: number
  total: number
  colorClass: string
}

const incomeCategories: CategoryItem[] = [
  { id: 'i1', name: 'Выручка', count: 84, total: 12_450_000, colorClass: 'bg-chart-palette-6' },
  { id: 'i2', name: 'Консультации', count: 12, total: 1_200_000, colorClass: 'bg-chart-palette-1' },
  { id: 'i3', name: 'Проектные доходы', count: 6, total: 2_800_000, colorClass: 'bg-chart-palette-3' },
  { id: 'i4', name: 'Проценты', count: 3, total: 35_000, colorClass: 'bg-chart-palette-8' },
  { id: 'i5', name: 'Прочие доходы', count: 2, total: 15_000, colorClass: 'bg-chart-palette-5' },
]

const expenseCategories: CategoryItem[] = [
  { id: 'e1', name: 'Зарплаты', count: 24, total: 2_100_000, colorClass: 'bg-chart-palette-7' },
  { id: 'e2', name: 'Аренда', count: 3, total: 450_000, colorClass: 'bg-chart-palette-10' },
  { id: 'e3', name: 'Маркетинг', count: 8, total: 380_000, colorClass: 'bg-chart-palette-8' },
  { id: 'e4', name: 'Подписки', count: 6, total: 120_000, colorClass: 'bg-chart-palette-6' },
  { id: 'e5', name: 'Логистика', count: 11, total: 290_000, colorClass: 'bg-chart-palette-2' },
  { id: 'e6', name: 'Канцтовары', count: 4, total: 18_000, colorClass: 'bg-chart-palette-11' },
  { id: 'e7', name: 'Связь', count: 3, total: 24_000, colorClass: 'bg-chart-palette-3' },
  { id: 'e8', name: 'Страхование', count: 2, total: 85_000, colorClass: 'bg-chart-palette-4' },
  { id: 'e9', name: 'Обучение', count: 2, total: 45_000, colorClass: 'bg-chart-palette-9' },
  { id: 'e10', name: 'Прочее', count: 7, total: 85_000, colorClass: 'bg-chart-palette-5' },
]

const totalIncome = incomeCategories.reduce((s, c) => s + c.total, 0)
const totalExpense = expenseCategories.reduce((s, c) => s + c.total, 0)

export default function CategoriesPage() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 space-y-6">
      {/* Header */}
      <Flex justifyContent="between" alignItems="center">
        <Flex flexDirection="col">
          <Title>Категории</Title>
          <Text className="text-tremor-content-subtle mt-1">Управление категориями доходов и расходов</Text>
        </Flex>
      </Flex>

      {/* KPI cards */}
      <Grid numItems={1} numItemsSm={2} className="gap-4">
        <Card>
          <Flex alignItems="center" className="gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <Text className="text-tremor-content-subtle">Доходы</Text>
          </Flex>
          <Metric className="text-success">{formatMoney(totalIncome)}</Metric>
          <Text className="text-tremor-content-subtle text-xs mt-1">{incomeCategories.length} категорий</Text>
        </Card>
        <Card>
          <Flex alignItems="center" className="gap-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
            <Text className="text-tremor-content-subtle">Расходы</Text>
          </Flex>
          <Metric className="text-danger">{formatMoney(totalExpense)}</Metric>
          <Text className="text-tremor-content-subtle text-xs mt-1">{expenseCategories.length} категорий</Text>
        </Card>
      </Grid>

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
            className={cn('h-3 w-3 rounded-full shrink-0', category.colorClass)}
            aria-hidden
          />
          <Text className="text-tremor-content font-medium">{category.name}</Text>
        </Flex>
        <Flex alignItems="center" className="gap-4">
          <Badge color="gray" size="sm">
            {category.count} оп.
          </Badge>
          <Text className="text-tremor-content tabular-nums font-medium w-36 text-right">
            {formatMoney(category.total)}
          </Text>
        </Flex>
      </Flex>
    </ListItem>
  )
}
