'use client'

import { motion } from 'framer-motion'
import { BarChart3, RotateCcw } from 'lucide-react'
import { Title, Subtitle, Text, Badge, Flex, Button, Grid } from '@tremor/react'
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
        <Flex flexDirection="col">
          <Title>Аналитика</Title>
          <Subtitle>Настраиваемая панель аналитики</Subtitle>
        </Flex>
        <Flex alignItems="center" className="space-x-2">
          <Button variant="secondary" size="sm" icon={RotateCcw} onClick={resetLayout}>
            Сбросить
          </Button>
        </Flex>
      </Flex>

      {/* Quick presets */}
      <Flex flexDirection="col" className="gap-2">
        <Text className="text-tremor-content-subtle text-xs uppercase tracking-wider">Быстрые пресеты</Text>
        <Flex className="flex-wrap gap-2">
          {CHART_PRESETS.map((preset) => (
            <Badge
              key={preset.id}
              size="sm"
              color="gray"
              icon={BarChart3}
            >
              {preset.title}
            </Badge>
          ))}
        </Flex>
      </Flex>

      {/* Chart grid */}
      <ChartGrid />
    </motion.div>
  )
}
