'use client'

import { motion } from 'framer-motion'
import { BarChart, AreaChart, Card, Title, Text, Grid, Flex, List, ListItem } from '@tremor/react'
import { KPIGrid } from '@/components/pulse/overview/kpi-card'

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

const moneyFormatter = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M ₽`
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}K ₽`
  return `${v} ₽`
}

export default function DashboardPage() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="p-6 space-y-6"
    >
      <div>
        <Title>Обзор</Title>
        <Text className="text-tremor-content-subtle mt-1">Финансовая сводка за текущий период</Text>
      </div>

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
            <div className="p-5">
              <Text className="text-tremor-content-subtle mb-4">Доходы vs Расходы</Text>
              <BarChart
                data={cashflowData}
                index="month"
                categories={['income', 'expense']}
                colors={['emerald', 'red']}
                valueFormatter={moneyFormatter}
                showGridLines={true}
                showAnimation={true}
                showLegend={true}
                showTooltip={true}
                yAxisWidth={60}
              />
            </div>
          </Card>
        </motion.div>

        {/* Balance trend */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <div className="p-5">
              <Text className="text-tremor-content-subtle mb-4">Динамика баланса</Text>
              <AreaChart
                data={balanceData}
                index="month"
                categories={['balance']}
                colors={['blue']}
                valueFormatter={moneyFormatter}
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

      {/* Recent transactions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <Text className="text-tremor-content-subtle mb-4">Последние операции</Text>
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
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium ${tx.direction === 'in' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                      {tx.direction === 'in' ? '↓' : '↑'}
                    </div>
                    <div>
                      <Text className="text-tremor-content">{tx.name}</Text>
                      <Text className="text-tremor-content-subtle text-xs">{tx.desc}</Text>
                    </div>
                  </Flex>
                  <div className="text-right">
                    <Text className={`text-sm tabular-nums font-medium ${tx.direction === 'in' ? 'text-success' : 'text-danger'}`}>
                      {tx.amount}
                    </Text>
                    <Text className="text-tremor-content-subtle text-xs">{tx.date}</Text>
                  </div>
                </Flex>
              </ListItem>
            ))}
          </List>
        </Card>
      </motion.div>
    </motion.div>
  )
}
