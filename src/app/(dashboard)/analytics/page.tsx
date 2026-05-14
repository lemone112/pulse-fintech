'use client'

import { motion } from 'framer-motion'
import { BarChart3, RotateCcw } from 'lucide-react'
import { Title, Text, Flex, Button } from '@tremor/react'
import { ChartGrid } from '@/components/pulse/analytics/chart-grid'
import { CHART_PRESETS } from '@/components/pulse/analytics/chart-presets'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

function resetLayout() {
  localStorage.removeItem('pulse-analytics-layout')
  window.location.reload()
}

export default function AnalyticsPage() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="p-6 space-y-6"
    >
      <Flex justifyContent="between" alignItems="center">
        <div>
          <Title>Аналитика</Title>
          <Text className="text-tremor-content-subtle mt-1">Настраиваемая панель аналитики</Text>
        </div>
        <Flex alignItems="center" className="space-x-2">
          <Button variant="secondary" size="sm" icon={RotateCcw} onClick={resetLayout}>
            Сбросить
          </Button>
        </Flex>
      </Flex>

      {/* Quick presets */}
      <div>
        <Text className="text-tremor-content-subtle text-xs uppercase tracking-wider mb-2">Быстрые пресеты</Text>
        <div className="flex flex-wrap gap-2">
          {CHART_PRESETS.map((preset) => (
            <span
              key={preset.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-tremor-border px-3 py-1 text-xs text-tremor-content-subtle hover:bg-tremor-background-muted hover:text-tremor-content transition-colors cursor-default"
            >
              <BarChart3 className="h-3 w-3" />
              {preset.title}
            </span>
          ))}
        </div>
      </div>

      {/* Chart grid */}
      <ChartGrid />
    </motion.div>
  )
}
