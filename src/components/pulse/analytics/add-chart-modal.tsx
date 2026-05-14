'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogPanel,
  Text,
  TextInput,
  Button,
  Select,
  SelectItem,
  Grid,
  Flex,
} from '@tremor/react'
import type { ChartConfig, ChartType } from './chart-presets'
import {
  CHART_TYPE_OPTIONS,
  X_AXIS_OPTIONS,
  Y_AXIS_OPTIONS,
  AGGREGATION_OPTIONS,
} from './chart-presets'

interface AddChartModalProps {
  open: boolean
  onClose: () => void
  onSave: (config: ChartConfig) => void
  editConfig?: ChartConfig | null
}

export function AddChartModal({ open, onClose, onSave, editConfig }: AddChartModalProps) {
  const [title, setTitle] = useState(editConfig?.title || '')
  const [chartType, setChartType] = useState<ChartType>(editConfig?.type || 'bar')
  const [xAxis, setXAxis] = useState(editConfig?.xAxis || 'month')
  const [yAxis, setYAxis] = useState(editConfig?.yAxis as string || 'amount')
  const [aggregation, setAggregation] = useState<ChartConfig['aggregation']>(editConfig?.aggregation || 'sum')
  const [groupBy, setGroupBy] = useState(editConfig?.groupBy || '')
  const [direction, setDirection] = useState<string>('all')

  const handleSave = () => {
    const config: ChartConfig = {
      id: editConfig?.id || `chart-${Date.now()}`,
      title: title || 'Новый график',
      type: chartType,
      xAxis,
      yAxis,
      aggregation: aggregation as ChartConfig['aggregation'],
      ...(groupBy ? { groupBy } : {}),
      ...(direction !== 'all' ? { filters: { direction: direction as 'in' | 'out' } } : {}),
    }
    onSave(config)
    onClose()
  }

  if (!open) return null

  return (
    <Dialog open={open} onClose={(v) => !v && onClose()} static>
      <DialogPanel className="sm:max-w-[520px]">
        <Text className="text-lg font-semibold text-tremor-content mb-4">
          {editConfig ? 'Редактировать график' : 'Добавить график'}
        </Text>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Text className="text-sm text-tremor-content-subtle">Название</Text>
            <TextInput
              value={title}
              onValueChange={setTitle}
              placeholder="Например: Доходы vs Расходы"
            />
          </div>

          {/* Chart type */}
          <div className="space-y-2">
            <Text className="text-sm text-tremor-content-subtle">Тип графика</Text>
            <div className="grid grid-cols-3 gap-2">
              {CHART_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setChartType(opt.value)}
                  className={`flex items-center gap-2 rounded-tremor-default border px-3 py-2 text-sm transition-colors ${
                    chartType === opt.value
                      ? 'border-tremor-brand bg-tremor-brand-subtle text-tremor-brand'
                      : 'border-tremor-border hover:bg-tremor-background-muted text-tremor-content'
                  }`}
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Axes */}
          <Grid numItems={1} numItemsMd={2} className="gap-4">
            <div className="space-y-2">
              <Text className="text-sm text-tremor-content-subtle">Ось X</Text>
              <Select value={xAxis} onValueChange={setXAxis}>
                {X_AXIS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Text className="text-sm text-tremor-content-subtle">Ось Y</Text>
              <Select value={yAxis} onValueChange={setYAxis}>
                {Y_AXIS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </Grid>

          {/* Aggregation */}
          <div className="space-y-2">
            <Text className="text-sm text-tremor-content-subtle">Агрегация</Text>
            <Select value={aggregation} onValueChange={(v) => setAggregation(v as ChartConfig['aggregation'])}>
              {AGGREGATION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </Select>
          </div>

          {/* Group by & Filters */}
          <Grid numItems={1} numItemsMd={2} className="gap-4">
            <div className="space-y-2">
              <Text className="text-sm text-tremor-content-subtle">Группировка</Text>
              <Select value={groupBy} onValueChange={setGroupBy} placeholder="Нет">
                <SelectItem value="direction">Направление</SelectItem>
                <SelectItem value="month">Месяц</SelectItem>
                <SelectItem value="category">Категория</SelectItem>
                <SelectItem value="project">Проект</SelectItem>
              </Select>
            </div>
            <div className="space-y-2">
              <Text className="text-sm text-tremor-content-subtle">Направление</Text>
              <Select value={direction} onValueChange={setDirection}>
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="in">Доходы</SelectItem>
                <SelectItem value="out">Расходы</SelectItem>
              </Select>
            </div>
          </Grid>
        </div>

        <Flex justifyContent="end" className="mt-6 gap-3">
          <Button variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {editConfig ? 'Сохранить' : 'Добавить'}
          </Button>
        </Flex>
      </DialogPanel>
    </Dialog>
  )
}
