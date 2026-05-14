'use client'

import { motion } from 'framer-motion'
import {
  Flex,
  Text,
  Title,
  Card,
  Grid,
  Metric,
  BadgeDelta,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Divider,
} from '@tremor/react'
import { TrendingUp, TrendingDown, CircleDollarSign } from 'lucide-react'
import { cn, formatMoney } from '@/lib/utils'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

// Demo data Q2 2026 vs Q1 2026
const pnlData = {
  revenue: {
    items: [
      { name: 'Выручка', q2: 12_450_000, q1: 10_800_000 },
      { name: 'Себестоимость', q2: -7_200_000, q1: -6_600_000 },
    ],
    subtotal: { name: 'Валовая прибыль', q2: 5_250_000, q1: 4_200_000 },
  },
  operating: {
    items: [
      { name: 'Зарплаты', q2: -2_100_000, q1: -1_950_000 },
      { name: 'Аренда', q2: -450_000, q1: -450_000 },
      { name: 'Маркетинг', q2: -380_000, q1: -520_000 },
      { name: 'Подписки', q2: -120_000, q1: -95_000 },
      { name: 'Прочее', q2: -85_000, q1: -110_000 },
    ],
    subtotal: { name: 'Операционная прибыль', q2: 2_115_000, q1: 1_075_000 },
  },
  nonOperating: {
    items: [
      { name: 'Проценты', q2: -35_000, q1: -42_000 },
      { name: 'Налоги', q2: -416_000, q1: -206_600 },
    ],
    subtotal: { name: 'Чистая прибыль', q2: 1_664_000, q1: 826_400 },
  },
}

const kpis = [
  {
    label: 'Выручка',
    value: pnlData.revenue.items[0].q2,
    delta: ((pnlData.revenue.items[0].q2 - pnlData.revenue.items[0].q1) / pnlData.revenue.items[0].q1) * 100,
    icon: TrendingUp,
    color: 'text-emerald-500',
  },
  {
    label: 'Валовая прибыль',
    value: pnlData.revenue.subtotal.q2,
    delta: ((pnlData.revenue.subtotal.q2 - pnlData.revenue.subtotal.q1) / pnlData.revenue.subtotal.q1) * 100,
    icon: CircleDollarSign,
    color: 'text-blue-500',
  },
  {
    label: 'Чистая прибыль',
    value: pnlData.nonOperating.subtotal.q2,
    delta:
      ((pnlData.nonOperating.subtotal.q2 - pnlData.nonOperating.subtotal.q1) /
        pnlData.nonOperating.subtotal.q1) *
      100,
    icon: TrendingDown,
    color: 'text-amber-500',
  },
]

export default function PnlPage() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 space-y-6">
      {/* Header */}
      <Flex justifyContent="between" alignItems="center">
        <Flex flexDirection="col">
          <Title>Отчёт о прибылях и убытках</Title>
          <Text className="text-tremor-content-subtle mt-1">ПиУ за Q2 2026 (апрель — июнь)</Text>
        </Flex>
        <BadgeDelta deltaType="increase" size="sm" />
      </Flex>

      {/* KPI cards */}
      <Grid numItems={1} numItemsSm={3} className="gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label}>
              <Flex alignItems="center" className="gap-2">
                <Icon className={cn('h-4 w-4', kpi.color)} />
                <Text className="text-tremor-content-subtle">{kpi.label}</Text>
              </Flex>
              <Metric>{formatMoney(kpi.value)}</Metric>
              <Flex alignItems="center" className="gap-1 mt-1">
                <BadgeDelta
                  deltaType={kpi.delta >= 0 ? 'increase' : 'decrease'}
                  size="xs"
                >
                  {kpi.delta >= 0 ? '+' : ''}{kpi.delta.toFixed(1)}%
                </BadgeDelta>
                <Text className="text-tremor-content-subtle text-xs">vs Q1</Text>
              </Flex>
            </Card>
          )
        })}
      </Grid>

      {/* P&L Table */}
      <Card>
        <Text className="text-tremor-content font-medium p-4 pb-0">Структура прибылей и убытков</Text>
        <Table className="mt-2">
          <TableHead>
            <TableRow>
              <TableHeaderCell>Статья</TableHeaderCell>
              <TableHeaderCell className="text-right">Q2 2026</TableHeaderCell>
              <TableHeaderCell className="text-right">Q1 2026</TableHeaderCell>
              <TableHeaderCell className="text-right">Изменение</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Revenue section */}
            <PnlSectionHeader label="ДОХОДЫ" />
            {pnlData.revenue.items.map((row) => (
              <PnlRow key={row.name} name={row.name} q2={row.q2} q1={row.q1} />
            ))}
            <PnlSubtotalRow name={pnlData.revenue.subtotal.name} q2={pnlData.revenue.subtotal.q2} q1={pnlData.revenue.subtotal.q1} />

            {/* Operating section */}
            <PnlSectionHeader label="ОПЕРАЦИОННЫЕ РАСХОДЫ" />
            {pnlData.operating.items.map((row) => (
              <PnlRow key={row.name} name={row.name} q2={row.q2} q1={row.q1} />
            ))}
            <PnlSubtotalRow name={pnlData.operating.subtotal.name} q2={pnlData.operating.subtotal.q2} q1={pnlData.operating.subtotal.q1} />

            {/* Non-operating section */}
            <PnlSectionHeader label="ВНЕОПЕРАЦИОННЫЕ РАСХОДЫ" />
            {pnlData.nonOperating.items.map((row) => (
              <PnlRow key={row.name} name={row.name} q2={row.q2} q1={row.q1} />
            ))}
            <PnlSubtotalRow name={pnlData.nonOperating.subtotal.name} q2={pnlData.nonOperating.subtotal.q2} q1={pnlData.nonOperating.subtotal.q1} highlight />
          </TableBody>
        </Table>
      </Card>
    </motion.div>
  )
}

function PnlSectionHeader({ label }: { label: string }) {
  return (
    <TableRow>
      <TableCell colSpan={4} className="pt-4 pb-1">
        <Text className="text-tremor-content-subtle text-xs font-semibold uppercase tracking-wider">{label}</Text>
        <Divider />
      </TableCell>
    </TableRow>
  )
}

function PnlRow({ name, q2, q1 }: { name: string; q2: number; q1: number }) {
  const change = q2 - q1
  return (
    <TableRow>
      <TableCell>
        <Text className="text-tremor-content pl-2">{name}</Text>
      </TableCell>
      <TableCell className="text-right">
        <Text className={cn('tabular-nums', q2 > 0 ? 'text-success' : q2 < 0 ? 'text-danger' : 'text-tremor-content-subtle')}>
          {formatMoney(q2)}
        </Text>
      </TableCell>
      <TableCell className="text-right">
        <Text className="text-tremor-content-subtle tabular-nums">{formatMoney(q1)}</Text>
      </TableCell>
      <TableCell className="text-right">
        <Text
          className={cn(
            'tabular-nums text-xs',
            change > 0 ? 'text-success' : change < 0 ? 'text-danger' : 'text-tremor-content-subtle'
          )}
        >
          {change >= 0 ? '+' : ''}{formatMoney(change)}
        </Text>
      </TableCell>
    </TableRow>
  )
}

function PnlSubtotalRow({ name, q2, q1, highlight }: { name: string; q2: number; q1: number; highlight?: boolean }) {
  const change = q2 - q1
  return (
    <TableRow className={cn(highlight && 'bg-tremor-background-muted')}>
      <TableCell>
        <Text className={cn('text-tremor-content font-semibold', highlight && 'text-base')}>{name}</Text>
      </TableCell>
      <TableCell className="text-right">
        <Text className={cn('tabular-nums font-semibold', q2 > 0 ? 'text-success' : q2 < 0 ? 'text-danger' : 'text-tremor-content')}>
          {formatMoney(q2)}
        </Text>
      </TableCell>
      <TableCell className="text-right">
        <Text className="text-tremor-content-subtle tabular-nums font-semibold">{formatMoney(q1)}</Text>
      </TableCell>
      <TableCell className="text-right">
        <Text
          className={cn(
            'tabular-nums text-xs font-semibold',
            change > 0 ? 'text-success' : change < 0 ? 'text-danger' : 'text-tremor-content-subtle'
          )}
        >
          {change >= 0 ? '+' : ''}{formatMoney(change)}
        </Text>
      </TableCell>
    </TableRow>
  )
}
