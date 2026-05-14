'use client'

import { motion } from 'framer-motion'
import { BarChart, AreaChart, Card, Title, Subtitle, Text, Bold, Grid, Flex, List, ListItem, Badge } from '@tremor/react'
import { KPIGrid } from '@/components/pulse/overview/kpi-card'
import { formatCompact } from '@/lib/utils'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const cashflowData = [
  { month: 'Янв', income: 2100000, expense: 1800000 },
  { month: 'Фев', income: 1900000, expense: 1750000 },
  { month: 'Мар', income: 2400000, expense: 1600000 },
  { month: 'Апр', income: 2200000, expense: 1900000 },
  { month: 'Май', income: 2450000, expense: 1830000 },
  { month: 'Июн', income: 2600000, expense: 1700000 },
]

const balanceData = [
  { month: 'Янв', balance: 3200000 },
  { month: 'Фев', balance: 3350000 },
  { month: 'Мар', balance: 3650000 },
  { month: 'Апр', balance: 3500000 },
  { month: 'Май', balance: 3800000 },
  { month: 'Июн', balance: 4120000 },
]

export default function DashboardPage() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="p-6 space-y-6"
    >
      <Flex flexDirection="col">
        <Title>Обзор</Title>
        <Subtitle>Финансовая сводка за текущий период</Subtitle>
      </Flex>

      <KPIGrid />

      {/* Charts row */}
      <Grid numItems={1} numItemsLg={2} className="gap-6">
        {/* Income vs Expense */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <Title className="text-tremor-content-subtle text-sm font-medium">Доходы vs Расходы</Title>
            <BarChart
              className="mt-4"
              data={cashflowData}
              index="month"
              categories={['income', 'expense']}
              colors={['emerald', 'red']}
              valueFormatter={formatCompact}
              showGridLines={true}
              showAnimation={true}
              showLegend={true}
              showTooltip={true}
              yAxisWidth={60}
            />
          </Card>
        </motion.div>

        {/* Balance trend */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <Title className="text-tremor-content-subtle text-sm font-medium">Динамика баланса</Title>
            <AreaChart
              className="mt-4"
              data={balanceData}
              index="month"
              categories={['balance']}
              colors={['blue']}
              valueFormatter={formatCompact}
              showGridLines={true}
              showAnimation={true}
              showLegend={true}
              showTooltip={true}
              yAxisWidth={60}
            />
          </Card>
        </motion.div>
      </Grid>

      {/* Recent transactions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <Title className="text-tremor-content-subtle text-sm font-medium mb-4">Последние операции</Title>
          <List>
            {[
              { name: 'ООО «Альфа»', desc: 'Оплата по счёту #1245', amount: '+₽ 350 000', date: 'Сегодня', direction: 'in' },
              { name: 'ИП Петров', desc: 'Аренда офиса', amount: '−₽ 120 000', date: 'Сегодня', direction: 'out' },
              { name: 'ООО «Бета»', desc: 'Консультационные услуги', amount: '+₽ 85 000', date: 'Вчера', direction: 'in' },
              { name: 'СКС Интернет', desc: 'Подписка на сервис', amount: '−₽ 15 000', date: 'Вчера', direction: 'out' },
              { name: 'ООО «Гамма»', desc: 'Проектная оплата', amount: '+₽ 420 000', date: '12 мая', direction: 'in' },
            ].map((tx, i) => (
              <ListItem key={i}>
                <Flex justifyContent="between" alignItems="center">
                  <Flex alignItems="center" className="space-x-3">
                    <Badge size="xs" color={tx.direction === 'in' ? 'emerald' : 'red'}>
                      {tx.direction === 'in' ? '↓' : '↑'}
                    </Badge>
                    <Flex flexDirection="col">
                      <Text className="text-tremor-content">
                        <Bold>{tx.name}</Bold>
                      </Text>
                      <Text className="text-tremor-content-subtle text-xs">{tx.desc}</Text>
                    </Flex>
                  </Flex>
                  <Flex flexDirection="col" alignItems="end">
                    <Text className={`text-sm tabular-nums font-medium ${tx.direction === 'in' ? 'text-success' : 'text-danger'}`}>
                      {tx.amount}
                    </Text>
                    <Text className="text-tremor-content-subtle text-xs">{tx.date}</Text>
                  </Flex>
                </Flex>
              </ListItem>
            ))}
          </List>
        </Card>
      </motion.div>
    </motion.div>
  )
}
