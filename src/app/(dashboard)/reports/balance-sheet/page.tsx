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
import { Scale, ShieldCheck, Percent } from 'lucide-react'
import { cn, formatMoney, formatNumber } from '@/lib/utils'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

// Balance sheet data as of 30.06.2026
const assets = {
  nonCurrent: {
    label: 'Внеоборотные активы',
    items: [
      { name: 'Основные средства', amount: 3_650_000 },
      { name: 'Нематериальные активы', amount: 280_000 },
    ],
    total: 3_930_000,
  },
  current: {
    label: 'Оборотные активы',
    items: [
      { name: 'Запасы (материалы, товары, НЗП)', amount: 1_710_000 },
      { name: 'Дебиторская задолженность', amount: 1_360_000 },
      { name: 'Денежные средства', amount: 4_807_000 },
    ],
    total: 7_877_000,
  },
  total: 11_807_000,
}

const liabilities = {
  equity: {
    label: 'Капитал и резервы',
    items: [
      { name: 'Уставный капитал', amount: 500_000 },
      { name: 'Нераспределённая прибыль', amount: 8_084_000 },
    ],
    total: 8_584_000,
  },
  longTerm: {
    label: 'Долгосрочные обязательства',
    items: [
      { name: 'Долгосрочные кредиты', amount: 850_000 },
    ],
    total: 850_000,
  },
  shortTerm: {
    label: 'Краткосрочные обязательства',
    items: [
      { name: 'Кредиторская задолженность', amount: 1_490_000 },
      { name: 'Займы краткосрочные', amount: 500_000 },
      { name: 'Задолженность по налогам', amount: 456_000 },
      { name: 'Задолженность по оплате труда', amount: 210_000 },
    ],
    total: 2_656_000,
  },
  total: 12_090_000,
}

// Adjust to balance — in real data total assets = total liabilities
// For demo, we adjust equity to make it balance
const adjustedEquity = assets.total - liabilities.longTerm.total - liabilities.shortTerm.total
liabilities.equity.total = adjustedEquity
liabilities.equity.items[1].amount = adjustedEquity - liabilities.equity.items[0].amount
liabilities.total = assets.total

const debtRatio = ((liabilities.longTerm.total + liabilities.shortTerm.total) / assets.total * 100)

export default function BalanceSheetPage() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 space-y-6">
      {/* Header */}
      <Flex justifyContent="between" alignItems="center">
        <Flex flexDirection="col">
          <Title>Бухгалтерский баланс</Title>
          <Text className="text-tremor-content-subtle mt-1">На 30 июня 2026 г.</Text>
        </Flex>
        <BadgeDelta deltaType="increase" size="sm" />
      </Flex>

      {/* KPI cards */}
      <Grid numItems={1} numItemsSm={3} className="gap-4">
        <Card>
          <Flex alignItems="center" className="gap-2">
            <Scale className="h-4 w-4 text-blue-500" />
            <Text className="text-tremor-content-subtle">Валюта баланса</Text>
          </Flex>
          <Metric>{formatMoney(assets.total)}</Metric>
        </Card>
        <Card>
          <Flex alignItems="center" className="gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <Text className="text-tremor-content-subtle">Собственный капитал</Text>
          </Flex>
          <Metric className="text-success">{formatMoney(liabilities.equity.total)}</Metric>
        </Card>
        <Card>
          <Flex alignItems="center" className="gap-2">
            <Percent className="h-4 w-4 text-amber-500" />
            <Text className="text-tremor-content-subtle">Доля заёмных средств</Text>
          </Flex>
          <Metric className={debtRatio > 60 ? 'text-danger' : debtRatio > 40 ? 'text-warning' : 'text-success'}>
            {debtRatio.toFixed(1)}%
          </Metric>
        </Card>
      </Grid>

      {/* Balance Sheet Table */}
      <Grid numItems={1} numItemsLg={2} className="gap-6">
        {/* АКТИВЫ */}
        <Card>
          <Text className="text-tremor-content font-semibold p-4 pb-0 text-lg">АКТИВЫ</Text>
          <Table className="mt-2">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Статья</TableHeaderCell>
                <TableHeaderCell className="text-right">Сумма, ₽</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Non-current */}
              <SectionHeader label={assets.nonCurrent.label} />
              {assets.nonCurrent.items.map((item) => (
                <TableRow key={item.name}>
                  <TableCell>
                    <Text className="text-tremor-content pl-3">{item.name}</Text>
                  </TableCell>
                  <TableCell className="text-right">
                    <Text className="text-tremor-content tabular-nums">{formatNumber(item.amount)}</Text>
                  </TableCell>
                </TableRow>
              ))}
              <SubtotalRow label={`Итого ${assets.nonCurrent.label.toLowerCase()}`} amount={assets.nonCurrent.total} />

              {/* Current */}
              <SectionHeader label={assets.current.label} />
              {assets.current.items.map((item) => (
                <TableRow key={item.name}>
                  <TableCell>
                    <Text className="text-tremor-content pl-3">{item.name}</Text>
                  </TableCell>
                  <TableCell className="text-right">
                    <Text className="text-tremor-content tabular-nums">{formatNumber(item.amount)}</Text>
                  </TableCell>
                </TableRow>
              ))}
              <SubtotalRow label={`Итого ${assets.current.label.toLowerCase()}`} amount={assets.current.total} />

              {/* Total assets */}
              <TableRow className="bg-tremor-background-muted border-t-2 border-tremor-border">
                <TableCell>
                  <Text className="text-tremor-content font-bold text-base">БАЛАНС</Text>
                </TableCell>
                <TableCell className="text-right">
                  <Text className="text-tremor-content tabular-nums font-bold text-base">{formatNumber(assets.total)}</Text>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Card>

        {/* ПАССИВЫ */}
        <Card>
          <Text className="text-tremor-content font-semibold p-4 pb-0 text-lg">ПАССИВЫ</Text>
          <Table className="mt-2">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Статья</TableHeaderCell>
                <TableHeaderCell className="text-right">Сумма, ₽</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Equity */}
              <SectionHeader label={liabilities.equity.label} />
              {liabilities.equity.items.map((item) => (
                <TableRow key={item.name}>
                  <TableCell>
                    <Text className="text-tremor-content pl-3">{item.name}</Text>
                  </TableCell>
                  <TableCell className="text-right">
                    <Text className="text-tremor-content tabular-nums">{formatNumber(item.amount)}</Text>
                  </TableCell>
                </TableRow>
              ))}
              <SubtotalRow label={`Итого ${liabilities.equity.label.toLowerCase()}`} amount={liabilities.equity.total} />

              {/* Long-term */}
              <SectionHeader label={liabilities.longTerm.label} />
              {liabilities.longTerm.items.map((item) => (
                <TableRow key={item.name}>
                  <TableCell>
                    <Text className="text-tremor-content pl-3">{item.name}</Text>
                  </TableCell>
                  <TableCell className="text-right">
                    <Text className="text-tremor-content tabular-nums">{formatNumber(item.amount)}</Text>
                  </TableCell>
                </TableRow>
              ))}
              <SubtotalRow label={`Итого ${liabilities.longTerm.label.toLowerCase()}`} amount={liabilities.longTerm.total} />

              {/* Short-term */}
              <SectionHeader label={liabilities.shortTerm.label} />
              {liabilities.shortTerm.items.map((item) => (
                <TableRow key={item.name}>
                  <TableCell>
                    <Text className="text-tremor-content pl-3">{item.name}</Text>
                  </TableCell>
                  <TableCell className="text-right">
                    <Text className="text-tremor-content tabular-nums">{formatNumber(item.amount)}</Text>
                  </TableCell>
                </TableRow>
              ))}
              <SubtotalRow label={`Итого ${liabilities.shortTerm.label.toLowerCase()}`} amount={liabilities.shortTerm.total} />

              {/* Total liabilities */}
              <TableRow className="bg-tremor-background-muted border-t-2 border-tremor-border">
                <TableCell>
                  <Text className="text-tremor-content font-bold text-base">БАЛАНС</Text>
                </TableCell>
                <TableCell className="text-right">
                  <Text className="text-tremor-content tabular-nums font-bold text-base">{formatNumber(liabilities.total)}</Text>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Card>
      </Grid>
    </motion.div>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <TableRow>
      <TableCell colSpan={2} className="pt-3 pb-1">
        <Text className="text-tremor-content-subtle text-xs font-semibold uppercase tracking-wider">{label}</Text>
      </TableCell>
    </TableRow>
  )
}

function SubtotalRow({ label, amount }: { label: string; amount: number }) {
  return (
    <TableRow className="border-t border-tremor-border">
      <TableCell>
        <Text className="text-tremor-content font-semibold">{label}</Text>
      </TableCell>
      <TableCell className="text-right">
        <Text className="text-tremor-content tabular-nums font-semibold">{formatNumber(amount)}</Text>
      </TableCell>
    </TableRow>
  )
}
