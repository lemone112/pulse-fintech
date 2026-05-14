export type ChartType = 'bar' | 'line' | 'area' | 'donut' | 'scatter' | 'radar'

export interface ChartConfig {
  id: string
  title: string
  type: ChartType
  xAxis: string
  yAxis: string | string[]
  groupBy?: string
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max'
  sortDir?: 'asc' | 'desc'
  limit?: number
  filters?: {
    direction?: 'in' | 'out'
    dateFrom?: string
    dateTo?: string
    categories?: string[]
  }
}

export const CHART_PRESETS: ChartConfig[] = [
  { id: 'income-vs-expense', title: 'Доходы vs Расходы', type: 'bar', xAxis: 'month', yAxis: 'amount', groupBy: 'direction' },
  { id: 'cashflow-trend', title: 'Динамика денежных потоков', type: 'area', xAxis: 'date', yAxis: 'amount', groupBy: 'direction' },
  { id: 'expense-by-category', title: 'Расходы по категориям', type: 'donut', xAxis: 'category', yAxis: 'amount' },
  { id: 'income-by-counterparty', title: 'Доходы по контрагентам', type: 'bar', xAxis: 'counterparty', yAxis: 'amount' },
  { id: 'balance-trend', title: 'Динамика баланса', type: 'line', xAxis: 'date', yAxis: 'balance' },
  { id: 'top-expense-categories', title: 'Топ расходов', type: 'bar', xAxis: 'category', yAxis: 'amount', sortDir: 'desc', limit: 10 },
  { id: 'monthly-comparison', title: 'Сравнение месяцев', type: 'bar', xAxis: 'category', yAxis: 'amount', groupBy: 'month' },
  { id: 'project-profitability', title: 'Прибыльность проектов', type: 'bar', xAxis: 'project', yAxis: 'amount' },
  { id: 'receivables-aging', title: 'Старение дебиторки', type: 'bar', xAxis: 'aging', yAxis: 'amount' },
  { id: 'budget-vs-actual', title: 'Бюджет vs Факт', type: 'bar', xAxis: 'category', yAxis: ['planned', 'actual'] },
]

export const CHART_TYPE_OPTIONS: Array<{ value: ChartType; label: string; icon: string }> = [
  { value: 'bar', label: 'Столбчатая', icon: '📊' },
  { value: 'line', label: 'Линейная', icon: '📈' },
  { value: 'area', label: 'Область', icon: '📉' },
  { value: 'donut', label: 'Кольцевая', icon: '🍩' },
  { value: 'scatter', label: 'Точечная', icon: '⚬' },
  { value: 'radar', label: 'Радарная', icon: '🕸' },
]

export const X_AXIS_OPTIONS = [
  { value: 'date', label: 'Дата' },
  { value: 'month', label: 'Месяц' },
  { value: 'week', label: 'Неделя' },
  { value: 'category', label: 'Категория' },
  { value: 'counterparty', label: 'Контрагент' },
  { value: 'project', label: 'Проект' },
  { value: 'aging', label: 'Возраст долга' },
]

export const Y_AXIS_OPTIONS = [
  { value: 'amount', label: 'Сумма' },
  { value: 'count', label: 'Количество' },
  { value: 'balance', label: 'Баланс' },
  { value: 'planned', label: 'План' },
  { value: 'actual', label: 'Факт' },
]

export const AGGREGATION_OPTIONS = [
  { value: 'sum', label: 'Сумма' },
  { value: 'avg', label: 'Среднее' },
  { value: 'count', label: 'Количество' },
  { value: 'min', label: 'Минимум' },
  { value: 'max', label: 'Максимум' },
]
