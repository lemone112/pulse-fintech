'use client'

import { motion } from 'framer-motion'
import {
  Flex,
  Text,
  Title,
  Card,
  Grid,
  Metric,
  BarChart,
  AreaChart,
  BadgeDelta,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tremor/react'
import { TrendingUp, TrendingDown, Wallet, ArrowUpDown } from 'lucide-react'
import { formatMoney, formatCompact } from '@/lib/utils'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const cashflowData = [
  { month: 'Октябрь', operating: 1200000, investing: -350000, financing: 0, net: 850000, balance: 3200000 },
  { month: 'Ноябрь', operating: 950000, investing: -120000, financing: 500000, net: 1330000, balance: 4530000 },
  { month: 'Декабрь', operating: 1100000, investing: -200000, financing: -300000, net: 600000, balance: 5130000 },
  { month: 'Январь', operating: 1350000, investing: -450000, financing: 0, net: 900000, balance: 6030000 },
  { month: 'Февраль', operating: 880000, investing: -80000, financing: 200000, net: 1000000, balance: 7030000 },
  { month: 'Март', operating: 1450000, investing: -310000, financing: -150000, net: 990000, balance: 8020000 },
]

const cashflowTableData = [
  { category: 'Операционная деятельность', oct: 1200000, nov: 950000, dec: 1100000, jan: 1350000, feb: 880000, mar: 1450000 },
  { category: '  Поступления от клиентов', oct: 1800000, nov: 1600000, dec: 1750000, jan: 2100000, feb: 1500000, mar: 2200000 },
  { category: '  Выплаты поставщикам', oct: -400000, nov: -500000, dec: -450000, jan: -550000, feb: -420000, mar: -500000 },
  { category: '  Зарплата и налоги', oct: -200000, nov: -150000, dec: -200000, jan: -200000, feb: -200000, mar: -250000 },
  { category: 'Инвестиционная деятельность', oct: -350000, nov: -120000, dec: -200000, jan: -450000, feb: -80000, mar: -310000 },
  { category: '  Приобретение ОС', oct: -350000, nov: -120000, dec: -200000, jan: -450000, feb: -80000, mar: -310000 },
  { category: 'Финансовая деятельность', oct: 0, nov: 500000, dec: -300000, jan: 0, feb: 200000, mar: -150000 },
  { category: '  Кредиты полученные', oct: 0, nov: 500000, dec: 0, jan: 0, feb: 200000, mar: 0 },
  { category: '  Погашение кредитов', oct: 0, nov: 0, dec: -300000, jan: 0, feb: 0, mar: -150000 },
]

export default function CashflowPage() {
  const totalOperating = cashflowData.reduce((s, d) => s + d.operating, 0)
  const totalInvesting = cashflowData.reduce((s, d) => s + d.investing, 0)
  const totalFinancing = cashflowData.reduce((s, d) => s + d.financing, 0)
  const currentBalance = cashflowData[cashflowData.length - 1].balance

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 space-y-6">
      {/* Header */}
      <Flex justifyContent="between" alignItems="center">
        <div>
          <Title>Отчёт о движении денежных средств</Title>
          <Text className="text-tremor-content-subtle mt-1">ДДС за октябрь 2024 — март 2025</Text>
        </div>
        <BadgeDelta deltaType="increase" size="sm" />
      </Flex>

      {/* KPI */}
      <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-4">
        <Card>
          <Flex alignItems="center" className="gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <Text className="text-tremor-content-subtle">Операционный</Text>
          </Flex>
          <Metric className="text-success">{formatMoney(totalOperating)}</Metric>
        </Card>
        <Card>
          <Flex alignItems="center" className="gap-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
            <Text className="text-tremor-content-subtle">Инвестиционный</Text>
          </Flex>
          <Metric className="text-danger">{formatMoney(totalInvesting)}</Metric>
        </Card>
        <Card>
          <Flex alignItems="center" className="gap-2">
            <ArrowUpDown className="h-4 w-4 text-blue-500" />
            <Text className="text-tremor-content-subtle">Финансовый</Text>
          </Flex>
          <Metric className="text-info">{formatMoney(totalFinancing)}</Metric>
        </Card>
        <Card>
          <Flex alignItems="center" className="gap-2">
            <Wallet className="h-4 w-4 text-tremor-content-subtle" />
            <Text className="text-tremor-content-subtle">Остаток</Text>
          </Flex>
          <Metric>{formatMoney(currentBalance)}</Metric>
        </Card>
      </Grid>

      {/* Charts */}
      <Grid numItems={1} numItemsLg={2} className="gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <div className="p-4">
              <Text className="text-tremor-content-subtle font-medium mb-4">ДДС по видам деятельности</Text>
              <BarChart
                data={cashflowData}
                index="month"
                categories={['operating', 'investing', 'financing']}
                colors={['emerald', 'red', 'blue']}
                valueFormatter={formatCompact}
                showGridLines={true}
                showAnimation={true}
                showLegend={true}
                showTooltip={true}
                yAxisWidth={60}
              />
            </div>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <div className="p-4">
              <Text className="text-tremor-content-subtle font-medium mb-4">Динамика остатка</Text>
              <AreaChart
                data={cashflowData}
                index="month"
                categories={['balance']}
                colors={['emerald']}
                valueFormatter={formatCompact}
                showGridLines={true}
                showAnimation={true}
                showLegend={true}
                showTooltip={true}
                yAxisWidth={60}
              />
            </div>
          </Card>
        </motion.div>
      </Grid>

      {/* Detailed Table */}
      <Card>
        <Text className="text-tremor-content font-medium p-4 pb-0">Детализация ДДС</Text>
        <Table className="mt-2">
          <TableHead>
            <TableRow>
              <TableHeaderCell>Категория</TableHeaderCell>
              <TableHeaderCell className="text-right">Окт</TableHeaderCell>
              <TableHeaderCell className="text-right">Ноя</TableHeaderCell>
              <TableHeaderCell className="text-right">Дек</TableHeaderCell>
              <TableHeaderCell className="text-right">Янв</TableHeaderCell>
              <TableHeaderCell className="text-right">Фев</TableHeaderCell>
              <TableHeaderCell className="text-right">Мар</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cashflowTableData.map((row) => {
              const isBold = !row.category.startsWith('  ')
              const values = [row.oct, row.nov, row.dec, row.jan, row.feb, row.mar]
              return (
                <TableRow key={row.category}>
                  <TableCell>
                    <Text className={`text-tremor-content ${isBold ? 'font-medium' : 'text-sm'}`}>
                      {row.category}
                    </Text>
                  </TableCell>
                  {values.map((v, idx) => (
                    <TableCell key={idx} className="text-right">
                      <Text
                        className={`tabular-nums ${isBold ? 'font-medium' : ''} ${
                          v > 0 ? 'text-success' : v < 0 ? 'text-danger' : 'text-tremor-content-subtle'
                        }`}
                      >
                        {v !== 0 ? formatMoney(v) : '—'}
                      </Text>
                    </TableCell>
                  ))}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>
    </motion.div>
  )
}
