'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Grid, Card, Flex, Text } from '@tremor/react'

import type { ChartConfig } from './chart-presets'
import { CHART_PRESETS } from './chart-presets'
import { ChartCard } from './chart-card'
import { AddChartModal } from './add-chart-modal'

const STORAGE_KEY = 'pulse-analytics-layout'

function loadLayout(): ChartConfig[] {
  if (typeof window === 'undefined') return CHART_PRESETS.slice(0, 4)
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {
    // ignore
  }
  return CHART_PRESETS.slice(0, 4)
}

function saveLayout(charts: ChartConfig[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(charts))
  } catch {
    // ignore
  }
}

function SortableChartCard({
  config,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  config: ChartConfig
  onEdit: (config: ChartConfig) => void
  onDuplicate: (config: ChartConfig) => void
  onDelete: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: config.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <ChartCard
        config={config}
        onEdit={onEdit}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        isDragging={isDragging}
        dragHandleProps={listeners}
      />
    </div>
  )
}

export function ChartGrid() {
  const [charts, setCharts] = useState<ChartConfig[]>(loadLayout)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<ChartConfig | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setCharts((prev) => {
        const oldIndex = prev.findIndex((c) => c.id === active.id)
        const newIndex = prev.findIndex((c) => c.id === over.id)
        const newCharts = arrayMove(prev, oldIndex, newIndex)
        saveLayout(newCharts)
        return newCharts
      })
    }
  }, [])

  const handleAdd = useCallback((config: ChartConfig) => {
    setCharts((prev) => {
      const newCharts = [...prev, config]
      saveLayout(newCharts)
      return newCharts
    })
  }, [])

  const handleEdit = useCallback((config: ChartConfig) => {
    setEditingConfig(config)
    setModalOpen(true)
  }, [])

  const handleSaveEdit = useCallback((config: ChartConfig) => {
    setCharts((prev) => {
      const newCharts = prev.map((c) => (c.id === config.id ? config : c))
      saveLayout(newCharts)
      return newCharts
    })
    setEditingConfig(null)
  }, [])

  const handleDuplicate = useCallback((config: ChartConfig) => {
    const newConfig: ChartConfig = {
      ...config,
      id: `chart-${Date.now()}`,
      title: `${config.title} (копия)`,
    }
    setCharts((prev) => {
      const newCharts = [...prev, newConfig]
      saveLayout(newCharts)
      return newCharts
    })
  }, [])

  const handleDelete = useCallback((id: string) => {
    setCharts((prev) => {
      const newCharts = prev.filter((c) => c.id !== id)
      saveLayout(newCharts)
      return newCharts
    })
  }, [])

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={charts.map((c) => c.id)} strategy={rectSortingStrategy}>
          <Grid numItems={1} numItemsMd={2} numItemsLg={3} className="gap-6">
            <AnimatePresence mode="popLayout">
              {charts.map((config) => (
                <SortableChartCard
                  key={config.id}
                  config={config}
                  onEdit={handleEdit}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>

            {/* Add chart card */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => {
                setEditingConfig(null)
                setModalOpen(true)
              }}
              className="rounded-lg border-2 border-dashed border-tremor-border bg-transparent hover:bg-tremor-background-muted transition-colors flex flex-col items-center justify-center min-h-[340px] gap-3 text-tremor-content-subtle hover:text-tremor-content"
            >
              <div className="h-10 w-10 rounded-full border-2 border-dashed border-current flex items-center justify-center">
                <Plus className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">Добавить график</span>
            </motion.button>
          </Grid>
        </SortableContext>
      </DndContext>

      <AddChartModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingConfig(null)
        }}
        onSave={editingConfig ? handleSaveEdit : handleAdd}
        editConfig={editingConfig}
      />
    </>
  )
}
