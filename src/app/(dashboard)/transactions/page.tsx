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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TextInput,
  Button,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@tremor/react'
import {
  Search,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
  Download,
} from 'lucide-react'
import { KpiCard } from '@/components/pulse/overview/kpi-card'
import { formatMoney } from '@/lib/utils'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}



const DEMO_TRANSACTIONS = [
  { id: 'TX-001', date: '01.03.2025', counterparty: 'ООО «Альфа»', category: 'Выручка', direction: 'income' as const, amount: 350000, description: 'Оплата по договору №1245' },
  { id: 'TX-002', date: '02.03.2025', counterparty: 'ИП Петров А.С.', category: 'Аренда', direction: 'expense' as const, amount: 120000, description: 'Аренда офиса март' },
  { id: 'TX-003', date: '03.03.2025', counterparty: 'ООО «Бета»', category: 'Услуги', direction: 'income' as const, amount: 85000, description: 'Консультационные услуги' },
  { id: 'TX-004', date: '04.03.2025', counterparty: 'СКС Интернет', category: 'Подписки', direction: 'expense' as const, amount: 15000, description: 'Подписка на сервис' },
  { id: 'TX-005', date: '05.03.2025', counterparty: 'ООО «Гамма»', category: 'Выручка', direction: 'income' as const, amount: 420000, description: 'Проектная оплата этап 2' },
  { id: 'TX-006', date: '06.03.2025', counterparty: 'ПАО «Дельта»', category: 'Материалы', direction: 'expense' as const, amount: 95000, description: 'Закупка материалов' },
  { id: 'TX-007', date: '07.03.2025', counterparty: 'ООО «Омега»', category: 'Выручка', direction: 'income' as const, amount: 275000, description: 'Лицензионные платежи' },
  { id: 'TX-008', date: '08.03.2025', counterparty: 'ИП Сидорова М.В.', category: 'Зарплата', direction: 'expense' as const, amount: 180000, description: 'Зарплата февраль' },
  { id: 'TX-009', date: '09.03.2025', counterparty: 'ООО «Вектор»', category: 'Выручка', direction: 'income' as const, amount: 530000, description: 'Разработка платформы' },
  { id: 'TX-010', date: '10.03.2025', counterparty: 'МУП «Горвод»', category: 'Коммунальные', direction: 'expense' as const, amount: 28000, description: 'Водоснабжение и канализация' },
  { id: 'TX-011', date: '11.03.2025', counterparty: 'ООО «Зета»', category: 'Выручка', direction: 'income' as const, amount: 190000, description: 'Аудиторские услуги' },
  { id: 'TX-012', date: '12.03.2025', counterparty: 'ПФР', category: 'Налоги', direction: 'expense' as const, amount: 142000, description: 'Страховые взносы' },
  { id: 'TX-013', date: '13.03.2025', counterparty: 'ООО «Каппа»', category: 'Оборудование', direction: 'expense' as const, amount: 310000, description: 'Серверное оборудование' },
  { id: 'TX-014', date: '14.03.2025', counterparty: 'ООО «Лямбда»', category: 'Выручка', direction: 'income' as const, amount: 165000, description: 'Сопровождение ПО' },
  { id: 'TX-015', date: '15.03.2025', counterparty: 'Роснефть', category: 'ГСМ', direction: 'expense' as const, amount: 45000, description: 'ГСМ автопарк март' },
  { id: 'TX-016', date: '16.03.2025', counterparty: 'ООО «Сигма»', category: 'Выручка', direction: 'income' as const, amount: 780000, description: 'Интеграционный проект' },
]

export default function TransactionsPage() {
  const [search, setSearch] = useState('')
  const [tabIndex, setTabIndex] = useState(0)

  const filtered = DEMO_TRANSACTIONS.filter((tx) => {
    const matchSearch =
      tx.counterparty.toLowerCase().includes(search.toLowerCase()) ||
      tx.description.toLowerCase().includes(search.toLowerCase()) ||
      tx.id.toLowerCase().includes(search.toLowerCase())
    if (tabIndex === 1) return matchSearch && tx.direction === 'income'
    if (tabIndex === 2) return matchSearch && tx.direction === 'expense'
    return matchSearch
  })

  const totalIncome = DEMO_TRANSACTIONS.filter((t) => t.direction === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = DEMO_TRANSACTIONS.filter((t) => t.direction === 'expense').reduce((s, t) => s + t.amount, 0)
  const net = totalIncome - totalExpense

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 space-y-6">
      {/* Header */}
      <Flex justifyContent="between" alignItems="center">
        <div>
          <Title>Операции</Title>
          <Text className="text-tremor-content-subtle mt-1">Список финансовых операций</Text>
        </div>
        <Flex justifyContent="end" alignItems="center" className="gap-2">
          <Button variant="secondary" size="sm" icon={Download}>
            Экспорт
          </Button>
          <Button variant="primary" size="sm" icon={Plus}>
            Добавить
          </Button>
        </Flex>
      </Flex>

      {/* KPI */}
      <Grid numItems={1} numItemsSm={2} numItemsLg={3} className="gap-4">
        <Card>
          <Text className="text-tremor-content-subtle">Доходы</Text>
          <Metric className="text-success">{formatMoney(totalIncome)}</Metric>
        </Card>
        <Card>
          <Text className="text-tremor-content-subtle">Расходы</Text>
          <Metric className="text-danger">{formatMoney(totalExpense)}</Metric>
        </Card>
        <Card>
          <Text className="text-tremor-content-subtle">Сальдо</Text>
          <Metric className={net >= 0 ? 'text-success' : 'text-danger'}>{formatMoney(net)}</Metric>
        </Card>
      </Grid>

      {/* Search + Tabs */}
      <Card>
        <div className="space-y-4">
          <Flex justifyContent="between" alignItems="center">
            <TextInput
              placeholder="Поиск по операции..."
              icon={Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <Button variant="light" size="sm" icon={SlidersHorizontal}>
              Фильтры
            </Button>
          </Flex>

          <TabGroup index={tabIndex} onIndexChange={setTabIndex}>
            <TabList>
              <Tab>Все</Tab>
              <Tab>Доходы</Tab>
              <Tab>Расходы</Tab>
            </TabList>
            <TabPanels>
              <TabPanel />
              <TabPanel />
              <TabPanel />
            </TabPanels>
          </TabGroup>

          {/* Table */}
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>№</TableHeaderCell>
                <TableHeaderCell>Дата</TableHeaderCell>
                <TableHeaderCell>Контрагент</TableHeaderCell>
                <TableHeaderCell>Категория</TableHeaderCell>
                <TableHeaderCell>Описание</TableHeaderCell>
                <TableHeaderCell className="text-right">Сумма</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((tx, i) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    <Text className="text-tremor-content-subtle text-xs font-mono">{tx.id}</Text>
                  </TableCell>
                  <TableCell>
                    <Text className="text-tremor-content">{tx.date}</Text>
                  </TableCell>
                  <TableCell>
                    <Flex alignItems="center" className="gap-2">
                      <div
                        className={`h-6 w-6 rounded-full flex items-center justify-center ${
                          tx.direction === 'income'
                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {tx.direction === 'income' ? (
                          <ArrowDownLeft className="h-3 w-3" />
                        ) : (
                          <ArrowUpRight className="h-3 w-3" />
                        )}
                      </div>
                      <Text className="text-tremor-content">{tx.counterparty}</Text>
                    </Flex>
                  </TableCell>
                  <TableCell>
                    <Badge size="xs" color={tx.direction === 'income' ? 'emerald' : 'red'}>
                      {tx.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Text className="text-tremor-content-subtle">{tx.description}</Text>
                  </TableCell>
                  <TableCell className="text-right">
                    <Text
                      className={`tabular-nums font-medium ${
                        tx.direction === 'income' ? 'text-success' : 'text-danger'
                      }`}
                    >
                      {tx.direction === 'income' ? '+' : '−'}{formatMoney(tx.amount)}
                    </Text>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filtered.length === 0 && (
            <Flex justifyContent="center" className="py-8">
              <Text className="text-tremor-content-subtle">Операции не найдены</Text>
            </Flex>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
