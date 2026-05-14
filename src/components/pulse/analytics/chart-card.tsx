'use client'

import { motion } from 'framer-motion'
import { MoreHorizontal, Pencil, Copy, Trash2, GripVertical } from 'lucide-react'
import { BarChart, LineChart, AreaChart, DonutChart, Card, Flex, Text } from '@tremor/react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
} from 'recharts'
import { cn } from '@/lib/utils'
import type { ChartConfig } from './chart-presets'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

// Demo data generators per chart type
function getDemoData(config: ChartConfig) {
  switch (config.id) {
    case 'income-vs-expense':
      return [
        { month: 'Янв', Доходы: 2100000, Расходы: 1800000 },
        { month: 'Фев', Доходы: 1900000, Расходы: 1750000 },
        { month: 'Мар', Доходы: 2400000, Расходы: 1600000 },
        { month: 'Апр', Доходы: 2200000, Расходы: 1900000 },
        { month: 'Май', Доходы: 2450000, Расходы: 1830000 },
        { month: 'Июн', Доходы: 2600000, Расходы: 1700000 },
      ]
    case 'cashflow-trend':
      return [
        { date: 'Янв', Доходы: 2100, Расходы: 1800 },
        { date: 'Фев', Доходы: 1900, Расходы: 1750 },
        { date: 'Мар', Доходы: 2400, Расходы: 1600 },
        { date: 'Апр', Доходы: 2200, Расходы: 1900 },
        { date: 'Май', Доходы: 2450, Расходы: 1830 },
        { date: 'Июн', Доходы: 2600, Расходы: 1700 },
      ]
    case 'expense-by-category':
      return [
        { category: 'Аренда', amount: 450000 },
        { category: 'Зарплаты', amount: 850000 },
        { category: 'Маркетинг', amount: 180000 },
        { category: 'Подписки', amount: 65000 },
        { category: 'Логистика', amount: 120000 },
        { category: 'Прочее', amount: 165000 },
      ]
    case 'income-by-counterparty':
      return [
        { counterparty: 'ООО «Альфа»', amount: 560000 },
        { counterparty: 'ООО «Бета»', amount: 420000 },
        { counterparty: 'ИП Петров', amount: 350000 },
        { counterparty: 'ООО «Гамма»', amount: 280000 },
        { counterparty: 'ПАО «Дельта»', amount: 190000 },
      ]
    case 'balance-trend':
      return [
        { date: 'Янв', balance: 3200 },
        { date: 'Фев', balance: 3350 },
        { date: 'Мар', balance: 3650 },
        { date: 'Апр', balance: 3500 },
        { date: 'Май', balance: 3800 },
        { date: 'Июн', balance: 4120 },
      ]
    case 'top-expense-categories':
      return [
        { category: 'Зарплаты', amount: 850 },
        { category: 'Аренда', amount: 450 },
        { category: 'Маркетинг', amount: 180 },
        { category: 'Логистика', amount: 120 },
        { category: 'Прочее', amount: 165 },
        { category: 'Подписки', amount: 65 },
        { category: 'Канцтовары', amount: 30 },
        { category: 'Связь', amount: 25 },
        { category: 'Страхование', amount: 40 },
        { category: 'Обучение', amount: 55 },
      ]
    case 'project-profitability':
      return [
        { project: 'Проект А', Прибыль: 450 },
        { project: 'Проект Б', Прибыль: 280 },
        { project: 'Проект В', Прибыль: 190 },
        { project: 'Проект Г', Прибыль: -50 },
        { project: 'Проект Д', Прибыль: 120 },
      ]
    case 'receivables-aging':
      return [
        { aging: '0-30 дней', amount: 850 },
        { aging: '31-60 дней', amount: 420 },
        { aging: '61-90 дней', amount: 180 },
        { aging: '90+ дней', amount: 95 },
      ]
    case 'budget-vs-actual':
      return [
        { category: 'Зарплаты', План: 900, Факт: 850 },
        { category: 'Аренда', План: 500, Факт: 450 },
        { category: 'Маркетинг', План: 200, Факт: 180 },
        { category: 'Логистика', План: 100, Факт: 120 },
        { category: 'Подписки', План: 60, Факт: 65 },
      ]
    default:
      return [
        { month: 'Янв', value: 100 },
        { month: 'Фев', value: 150 },
        { month: 'Мар', value: 200 },
        { month: 'Апр', value: 180 },
        { month: 'Май', value: 250 },
        { month: 'Июн', value: 300 },
      ]
  }
}

/** Map data key names to Tremor color tokens */
function getTremorColors(categories: string[]): string[] {
  const semanticMap: Record<string, string> = {
    'Доходы': 'emerald',
    'income': 'emerald',
    'Расходы': 'red',
    'expense': 'red',
    'План': 'blue',
    'planned': 'blue',
    'Факт': 'amber',
    'actual': 'amber',
    'Баланс': 'blue',
    'balance': 'blue',
    'Прибыль': 'emerald',
    'amount': 'blue',
    'value': 'blue',
  }
  const defaults = ['blue', 'emerald', 'amber', 'red', 'violet', 'cyan', 'pink', 'teal', 'orange', 'indigo']
  return categories.map((cat, i) => semanticMap[cat] ?? defaults[i % defaults.length])
}

/** Smart number formatter for chart values */
function formatChartValue(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(v >= 100_000 ? 0 : 1)}K`
  return new Intl.NumberFormat('ru-RU').format(v)
}

interface ChartCardProps {
  config: ChartConfig
  onEdit?: (config: ChartConfig) => void
  onDuplicate?: (config: ChartConfig) => void
  onDelete?: (id: string) => void
  isDragging?: boolean
  dragHandleProps?: Record<string, unknown>
}

export function ChartCard({ config, onEdit, onDuplicate, onDelete, isDragging, dragHandleProps }: ChartCardProps) {
  const data = getDemoData(config)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        isDragging && 'shadow-lg ring-2 ring-primary/20 opacity-80',
      )}
    >
      <Card>
        {/* Header */}
        <Flex justifyContent="between" alignItems="center" className="px-4 py-3 border-b border-tremor-border">
          <Flex className="gap-2">
            <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-tremor-background-subtle rounded">
              <GripVertical className="h-4 w-4 text-tremor-content-subtle" />
            </div>
            <Text className="text-sm font-medium text-tremor-content truncate">{config.title}</Text>
          </Flex>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(config)}>
                <Pencil className="h-4 w-4 mr-2" /> Редактировать
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate?.(config)}>
                <Copy className="h-4 w-4 mr-2" /> Дублировать
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete?.(config.id)} className="text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" /> Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Flex>

        {/* Chart body */}
        <div className="p-4">
          <ChartRenderer config={config} data={data} />
        </div>
      </Card>
    </motion.div>
  )
}

function ChartRenderer({ config, data }: { config: ChartConfig; data: Record<string, unknown>[] }) {
  // Derive Y-axis categories from data keys, excluding the X-axis key
  const categories = Object.keys(data[0] || {}).filter(k => k !== config.xAxis)
  const colors = getTremorColors(categories)

  switch (config.type) {
    case 'bar':
      return (
        <BarChart
          data={data}
          index={config.xAxis}
          categories={categories}
          colors={colors}
          valueFormatter={formatChartValue}
          showGridLines={true}
          showAnimation={true}
          showLegend={true}
          showTooltip={true}
          yAxisWidth={60}
        />
      )

    case 'line':
      return (
        <LineChart
          data={data}
          index={config.xAxis}
          categories={categories}
          colors={colors}
          valueFormatter={formatChartValue}
          showGridLines={true}
          showAnimation={true}
          showLegend={true}
          showTooltip={true}
          yAxisWidth={60}
        />
      )

    case 'area':
      return (
        <AreaChart
          data={data}
          index={config.xAxis}
          categories={categories}
          colors={colors}
          valueFormatter={formatChartValue}
          showGridLines={true}
          showAnimation={true}
          showLegend={true}
          showTooltip={true}
          yAxisWidth={60}
        />
      )

    case 'donut':
      return (
        <DonutChart
          data={data}
          category="amount"
          index={config.xAxis}
          colors={['blue', 'emerald', 'amber', 'red', 'violet', 'cyan', 'pink', 'teal', 'orange', 'indigo']}
          showLabel={true}
          showAnimation={true}
          showTooltip={true}
          valueFormatter={formatChartValue}
        />
      )

    case 'scatter':
      // Tremor doesn't have scatter — keep raw Recharts with CSS variable colors
      return (
        <ResponsiveContainer width="100%" height={240}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-tremor-border)" />
            <XAxis dataKey="x" tick={{ fontSize: 11 }} stroke="var(--color-tremor-content-subtle)" name="X" />
            <YAxis dataKey="y" tick={{ fontSize: 11 }} stroke="var(--color-tremor-content-subtle)" name="Y" />
            <ZAxis dataKey="z" range={[50, 400]} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-tremor-background)',
                border: '1px solid var(--color-tremor-border)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Scatter
              data={data.map(() => ({ x: Math.random() * 100, y: Math.random() * 100, z: Math.random() * 100 + 50 }))}
              fill="var(--color-primary-9)"
            />
          </ScatterChart>
        </ResponsiveContainer>
      )

    case 'radar':
      // Tremor doesn't have radar — keep raw Recharts with CSS variable colors
      return (
        <ResponsiveContainer width="100%" height={240}>
          <RadarChart data={data.slice(0, 6).map((d) => ({ subject: (d.category || d.month || 'Item') as string, value: (d.amount as number) || (d.value as number) || 0 }))}>
            <PolarGrid stroke="var(--color-tremor-border)" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} stroke="var(--color-tremor-content-subtle)" />
            <PolarRadiusAxis tick={{ fontSize: 10 }} stroke="var(--color-tremor-content-subtle)" />
            <Radar name="Значение" dataKey="value" stroke="var(--color-primary-9)" fill="var(--color-primary-9)" fillOpacity={0.3} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-tremor-background)',
                border: '1px solid var(--color-tremor-border)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      )

    default:
      return <Flex justifyContent="center" alignItems="center" className="h-60 text-tremor-content-subtle text-sm">Неподдерживаемый тип графика</Flex>
  }
}
