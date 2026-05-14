'use client'

import { motion } from 'framer-motion'
import {
  Flex,
  Text,
  Title,
  Card,
  Metric,
  BadgeDelta,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Grid,
} from '@tremor/react'
import { BookOpen, CheckCircle } from 'lucide-react'
import { cn, formatMoney, formatNumber } from '@/lib/utils'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

interface TrialRow {
  account: string
  name: string
  debitOpen: number
  creditOpen: number
  debitTurn: number
  creditTurn: number
  debitClose: number
  creditClose: number
}

// Demo data — all column pairs balance (Дебет = Кредит)
const trialData: TrialRow[] = [
  { account: '01', name: 'Основные средства',        debitOpen: 3_200_000, creditOpen: 0, debitTurn: 450_000, creditTurn: 0, debitClose: 3_650_000, creditClose: 0 },
  { account: '10', name: 'Материалы',                debitOpen: 580_000, creditOpen: 0, debitTurn: 320_000, creditTurn: 290_000, debitClose: 610_000, creditClose: 0 },
  { account: '20', name: 'Основное производство',    debitOpen: 120_000, creditOpen: 0, debitTurn: 1_850_000, creditTurn: 1_780_000, debitClose: 190_000, creditClose: 0 },
  { account: '26', name: 'Общехозяйственные расходы', debitOpen: 0, creditOpen: 0, debitTurn: 640_000, creditTurn: 640_000, debitClose: 0, creditClose: 0 },
  { account: '41', name: 'Товары',                   debitOpen: 950_000, creditOpen: 0, debitTurn: 780_000, creditTurn: 820_000, debitClose: 910_000, creditClose: 0 },
  { account: '50', name: 'Касса',                    debitOpen: 15_000, creditOpen: 0, debitTurn: 280_000, creditTurn: 278_000, debitClose: 17_000, creditClose: 0 },
  { account: '51', name: 'Расчётные счета',          debitOpen: 4_120_000, creditOpen: 0, debitTurn: 8_650_000, creditTurn: 7_980_000, debitClose: 4_790_000, creditClose: 0 },
  { account: '60', name: 'Расчёты с поставщиками',   debitOpen: 0, creditOpen: 1_350_000, debitTurn: 1_480_000, creditTurn: 1_620_000, debitClose: 0, creditClose: 1_490_000 },
  { account: '62', name: 'Расчёты с покупателями',   debitOpen: 890_000, creditOpen: 0, debitTurn: 9_340_000, creditTurn: 8_870_000, debitClose: 1_360_000, creditClose: 0 },
  { account: '68', name: 'Налоги',                   debitOpen: 0, creditOpen: 420_000, debitTurn: 380_000, creditTurn: 416_000, debitClose: 0, creditClose: 456_000 },
  { account: '70', name: 'Расчёты по оплате труда',  debitOpen: 0, creditOpen: 210_000, debitTurn: 2_100_000, creditTurn: 2_100_000, debitClose: 0, creditClose: 210_000 },
  { account: '71', name: 'Расчёты с подотчётными лицами', debitOpen: 25_000, creditOpen: 0, debitTurn: 85_000, creditTurn: 92_000, debitClose: 18_000, creditClose: 0 },
  { account: '80', name: 'Уставный капитал',         debitOpen: 0, creditOpen: 500_000, debitTurn: 0, creditTurn: 0, debitClose: 0, creditClose: 500_000 },
  { account: '84', name: 'Нераспределённая прибыль', debitOpen: 0, creditOpen: 6_420_000, debitTurn: 0, creditTurn: 1_664_000, debitClose: 0, creditClose: 8_084_000 },
  { account: '90', name: 'Продажи',                  debitOpen: 0, creditOpen: 0, debitTurn: 12_450_000, creditTurn: 12_450_000, debitClose: 0, creditClose: 0 },
  { account: '91', name: 'Прочие доходы/расходы',    debitOpen: 0, creditOpen: 0, debitTurn: 35_000, creditTurn: 35_000, debitClose: 0, creditClose: 0 },
]

// Compute totals
const totals = trialData.reduce(
  (acc, row) => ({
    debitOpen: acc.debitOpen + row.debitOpen,
    creditOpen: acc.creditOpen + row.creditOpen,
    debitTurn: acc.debitTurn + row.debitTurn,
    creditTurn: acc.creditTurn + row.creditTurn,
    debitClose: acc.debitClose + row.debitClose,
    creditClose: acc.creditClose + row.creditClose,
  }),
  { debitOpen: 0, creditOpen: 0, debitTurn: 0, creditTurn: 0, debitClose: 0, creditClose: 0 }
)

const isOpenBalanced = totals.debitOpen === totals.creditOpen
const isTurnBalanced = totals.debitTurn === totals.creditTurn
const isCloseBalanced = totals.debitClose === totals.creditClose

export default function TrialBalancePage() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 space-y-6">
      {/* Header */}
      <Flex justifyContent="between" alignItems="center">
        <div>
          <Title>Оборотная ведомость</Title>
          <Text className="text-tremor-content-subtle mt-1">За Q2 2026 (апрель — июнь)</Text>
        </div>
      </Flex>

      {/* KPI cards */}
      <Grid numItems={1} numItemsSm={3} className="gap-4">
        <Card>
          <Flex alignItems="center" className="gap-2">
            <BookOpen className="h-4 w-4 text-blue-500" />
            <Text className="text-tremor-content-subtle">Счетов в ведомости</Text>
          </Flex>
          <Metric>{trialData.length}</Metric>
        </Card>
        <Card>
          <Flex alignItems="center" className="gap-2">
            <CheckCircle className={cn('h-4 w-4', isOpenBalanced && isTurnBalanced && isCloseBalanced ? 'text-emerald-500' : 'text-red-500')} />
            <Text className="text-tremor-content-subtle">Баланс</Text>
          </Flex>
          <Metric className={isOpenBalanced && isTurnBalanced && isCloseBalanced ? 'text-success' : 'text-danger'}>
            {isOpenBalanced && isTurnBalanced && isCloseBalanced ? 'Сходится' : 'Не сходится'}
          </Metric>
        </Card>
        <Card>
          <Flex alignItems="center" className="gap-2">
            <Text className="text-tremor-content-subtle">Обороты за период</Text>
          </Flex>
          <Metric>{formatMoney(totals.debitTurn)}</Metric>
        </Card>
      </Grid>

      {/* Trial Balance Table */}
      <Card>
        <Text className="text-tremor-content font-medium p-4 pb-0">Оборотная ведомость по счетам</Text>
        <div className="overflow-x-auto">
          <Table className="mt-2">
            <TableHead>
              <TableRow>
                <TableHeaderCell className="w-16">Счёт</TableHeaderCell>
                <TableHeaderCell>Название</TableHeaderCell>
                <TableHeaderCell className="text-right">Дебет (вход.)</TableHeaderCell>
                <TableHeaderCell className="text-right">Кредит (вход.)</TableHeaderCell>
                <TableHeaderCell className="text-right">Дебет (оборот)</TableHeaderCell>
                <TableHeaderCell className="text-right">Кредит (оборот)</TableHeaderCell>
                <TableHeaderCell className="text-right">Дебет (исх.)</TableHeaderCell>
                <TableHeaderCell className="text-right">Кредит (исх.)</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {trialData.map((row) => (
                <TableRow key={row.account}>
                  <TableCell>
                    <Text className="text-tremor-brand font-mono font-medium">{row.account}</Text>
                  </TableCell>
                  <TableCell>
                    <Text className="text-tremor-content">{row.name}</Text>
                  </TableCell>
                  <TableCell className="text-right">
                    <Text className="text-tremor-content tabular-nums">{row.debitOpen ? formatNumber(row.debitOpen) : '—'}</Text>
                  </TableCell>
                  <TableCell className="text-right">
                    <Text className="text-tremor-content tabular-nums">{row.creditOpen ? formatNumber(row.creditOpen) : '—'}</Text>
                  </TableCell>
                  <TableCell className="text-right">
                    <Text className="text-tremor-content tabular-nums">{row.debitTurn ? formatNumber(row.debitTurn) : '—'}</Text>
                  </TableCell>
                  <TableCell className="text-right">
                    <Text className="text-tremor-content tabular-nums">{row.creditTurn ? formatNumber(row.creditTurn) : '—'}</Text>
                  </TableCell>
                  <TableCell className="text-right">
                    <Text className="text-tremor-content tabular-nums font-medium">{row.debitClose ? formatNumber(row.debitClose) : '—'}</Text>
                  </TableCell>
                  <TableCell className="text-right">
                    <Text className="text-tremor-content tabular-nums font-medium">{row.creditClose ? formatNumber(row.creditClose) : '—'}</Text>
                  </TableCell>
                </TableRow>
              ))}
              {/* Totals row */}
              <TableRow className="bg-tremor-background-muted border-t-2 border-tremor-border">
                <TableCell colSpan={2}>
                  <Text className="text-tremor-content font-bold">ИТОГО</Text>
                </TableCell>
                <TableCell className="text-right">
                  <Text className="tabular-nums font-bold text-tremor-content">{formatNumber(totals.debitOpen)}</Text>
                </TableCell>
                <TableCell className="text-right">
                  <Text className="tabular-nums font-bold text-tremor-content">{formatNumber(totals.creditOpen)}</Text>
                </TableCell>
                <TableCell className="text-right">
                  <Text className="tabular-nums font-bold text-tremor-content">{formatNumber(totals.debitTurn)}</Text>
                </TableCell>
                <TableCell className="text-right">
                  <Text className="tabular-nums font-bold text-tremor-content">{formatNumber(totals.creditTurn)}</Text>
                </TableCell>
                <TableCell className="text-right">
                  <Text className="tabular-nums font-bold text-tremor-content">{formatNumber(totals.debitClose)}</Text>
                </TableCell>
                <TableCell className="text-right">
                  <Text className="tabular-nums font-bold text-tremor-content">{formatNumber(totals.creditClose)}</Text>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Card>
    </motion.div>
  )
}
