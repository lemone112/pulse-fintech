'use client'

import { motion, type Variants } from 'framer-motion'
import { Card, Metric, BadgeDelta, DeltaType, Flex, Text, Bold, Grid } from '@tremor/react'
import { cn } from '@/lib/utils'

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
}

const numberVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
}

function deltaToDeltaType(delta: number): DeltaType {
  if (delta > 0) return 'increase'
  if (delta < 0) return 'decrease'
  return 'unchanged'
}

interface KpiCardProps {
  title: string
  value: string
  previousValue?: string
  delta?: number
  prefix?: string
  suffix?: string
  className?: string
}

export function KpiCard({
  title,
  value,
  delta,
  prefix,
  suffix,
  className,
}: KpiCardProps) {
  const deltaType: DeltaType = delta !== undefined ? deltaToDeltaType(delta) : 'unchanged'

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      <Card className="h-full">
        <Flex justifyContent="between" alignItems="center">
          <Text className="text-xs font-medium uppercase tracking-wider text-tremor-content-subtle">{title}</Text>
          {delta !== undefined && (
            <BadgeDelta deltaType={deltaType} size="xs" />
          )}
        </Flex>

        <Flex alignItems="baseline" className="mt-2 gap-2">
          {prefix && (
            <Text className="text-sm text-tremor-content-subtle">{prefix}</Text>
          )}
          <motion.span
            variants={numberVariants}
            initial="hidden"
            animate="visible"
          >
            <Metric className="text-2xl">
              <Bold>{value}</Bold>
            </Metric>
          </motion.span>
          {suffix && (
            <Text className="text-sm text-tremor-content-subtle">{suffix}</Text>
          )}
        </Flex>

        {delta !== undefined && (
          <Flex alignItems="center" className="mt-2 gap-1.5">
            <Text
              className={cn(
                'text-xs tabular-nums font-medium',
                deltaType === 'increase' && 'text-success',
                deltaType === 'decrease' && 'text-danger',
                deltaType === 'unchanged' && 'text-muted-foreground',
              )}
            >
              {delta > 0 && '+'}
              {delta.toFixed(1)}%
            </Text>
            <Text className="text-xs text-tremor-content-subtle">
              vs прошлый период
            </Text>
          </Flex>
        )}
      </Card>
    </motion.div>
  )
}

const gridVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
}

export function KpiGrid({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={gridVariants}
      initial="hidden"
      animate="visible"
      className="tremor-grid"
    >
      <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-4">
        {children}
      </Grid>
    </motion.div>
  )
}

/** Pre-populated KPI grid with demo data */
export function KPIGrid() {
  return (
    <KpiGrid>
      <KpiCard title="Доходы" value="₽ 2 450 000" delta={12.5} />
      <KpiCard title="Расходы" value="₽ 1 830 000" delta={-3.2} />
      <KpiCard title="Прибыль" value="₽ 620 000" delta={28.4} />
      <KpiCard title="Остаток" value="₽ 4 120 000" delta={5.1} />
    </KpiGrid>
  )
}
