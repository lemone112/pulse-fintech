'use client'

import { motion } from 'framer-motion'
import { Download, Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Card, Badge, Flex, Text } from '@tremor/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { STATUS_MAP, TYPE_MAP, TYPE_ICON_MAP } from './constants'

type TremorBadgeColor = 'emerald' | 'amber' | 'red' | 'gray' | 'blue' | 'violet' | 'pink' | 'cyan' | 'orange' | 'indigo' | 'teal' | 'fuchsia' | 'purple' | 'lime' | 'yellow' | 'rose'

function statusToTremorColor(status: string): TremorBadgeColor {
  switch (status) {
    case 'signed':
      return 'emerald'
    case 'pending':
      return 'amber'
    case 'paid':
      return 'emerald'
    case 'draft':
      return 'gray'
    default:
      return 'gray'
  }
}

interface DocumentCardProps {
  document: {
    id: string
    title: string
    type: string
    status: string
    date: string
    size: string
  }
  index: number
}

export function DocumentCard({ document: doc, index }: DocumentCardProps) {
  const status = STATUS_MAP[doc.status] || STATUS_MAP.draft

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Card className="flex items-center justify-between hover:bg-muted/50 transition-colors">
        <Flex alignItems="center" className="gap-3">
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-lg">
            {TYPE_ICON_MAP[doc.type] || '📄'}
          </div>
          <div>
            <Text className="text-sm font-medium text-tremor-content">{doc.title}</Text>
            <Flex alignItems="center" className="gap-2 mt-0.5">
              <Text className="text-xs text-tremor-content-subtle">{TYPE_MAP[doc.type] || doc.type}</Text>
              <Text className="text-xs text-tremor-content-subtle">·</Text>
              <Text className="text-xs text-tremor-content-subtle">{doc.date}</Text>
              <Text className="text-xs text-tremor-content-subtle">·</Text>
              <Text className="text-xs text-tremor-content-subtle">{doc.size}</Text>
            </Flex>
          </div>
        </Flex>

        <Flex alignItems="center" className="gap-2">
          <Badge color={statusToTremorColor(doc.status)} size="xs">
            {status.label}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Eye className="h-4 w-4 mr-2" /> Просмотр
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" /> Скачать
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Pencil className="h-4 w-4 mr-2" /> Редактировать
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" /> Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Flex>
      </Card>
    </motion.div>
  )
}
