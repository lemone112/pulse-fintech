'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Flex,
  Text,
  Title,
  Card,
  Grid,
  Metric,
  Badge,
  List,
  ListItem,
  Button,
  Divider,
} from '@tremor/react'
import {
  ThumbsUp,
  ThumbsDown,
  Clock,
  FileText,
  CreditCard,
  Receipt,
  User,
  Calendar,
} from 'lucide-react'
import { formatMoney } from '@/lib/utils'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

type ApprovalType = 'payment' | 'contract' | 'invoice' | 'expense'

const typeIcons: Record<ApprovalType, React.ElementType> = {
  payment: CreditCard,
  contract: FileText,
  invoice: Receipt,
  expense: CreditCard,
}

const typeLabels: Record<ApprovalType, string> = {
  payment: 'Платёж',
  contract: 'Договор',
  invoice: 'Счёт',
  expense: 'Расход',
}

type ApprovalStatus = 'pending' | 'approved' | 'rejected'

const statusBadge: Record<ApprovalStatus, { color: 'amber' | 'emerald' | 'red'; label: string }> = {
  pending: { color: 'amber', label: 'Ожидает' },
  approved: { color: 'emerald', label: 'Согласовано' },
  rejected: { color: 'red', label: 'Отклонено' },
}

interface Approval {
  id: string
  type: ApprovalType
  title: string
  requester: string
  amount: number
  date: string
  status: ApprovalStatus
  comment?: string
}

const INITIAL_APPROVALS: Approval[] = [
  { id: 'APR-001', type: 'payment', title: 'Оплата серверного оборудования', requester: 'Иванов А.П.', amount: 310000, date: '01.03.2025', status: 'pending' },
  { id: 'APR-002', type: 'contract', title: 'Договор с ООО «Вектор» на разработку', requester: 'Смирнова Е.В.', amount: 530000, date: '02.03.2025', status: 'pending' },
  { id: 'APR-003', type: 'invoice', title: 'Счёт от ООО «Бета» за аудит', requester: 'Козлов Д.И.', amount: 85000, date: '03.03.2025', status: 'pending' },
  { id: 'APR-004', type: 'expense', title: 'Командировочные расходы', requester: 'Новикова А.С.', amount: 45000, date: '04.03.2025', status: 'pending' },
  { id: 'APR-005', type: 'payment', title: 'Аванс подрядчику ИП Петров', requester: 'Иванов А.П.', amount: 120000, date: '05.03.2025', status: 'pending' },
  { id: 'APR-006', type: 'contract', title: 'Договор аренды нового офиса', requester: 'Фёдорова Л.М.', amount: 240000, date: '06.03.2025', status: 'pending' },
  { id: 'APR-007', type: 'expense', title: 'Закупка лицензий ПО', requester: 'Козлов Д.И.', amount: 75000, date: '07.03.2025', status: 'pending' },
]

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>(INITIAL_APPROVALS)

  const pending = approvals.filter((a) => a.status === 'pending')
  const resolved = approvals.filter((a) => a.status !== 'pending')
  const totalPendingAmount = pending.reduce((s, a) => s + a.amount, 0)

  const handleAction = (id: string, action: 'approved' | 'rejected') => {
    setApprovals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: action } : a))
    )
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 space-y-6">
      {/* Header */}
      <Flex justifyContent="between" alignItems="center">
        <Flex flexDirection="col">
          <Title>Согласование</Title>
          <Text className="text-tremor-content-subtle mt-1">Очередь документов на согласование</Text>
        </Flex>
      </Flex>

      {/* KPI Cards */}
      <Grid numItems={1} numItemsSm={3} className="gap-4">
        <Card>
          <Flex alignItems="center" className="gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <Text className="text-tremor-content-subtle">Ожидает</Text>
          </Flex>
          <Metric>{pending.length}</Metric>
        </Card>
        <Card>
          <Text className="text-tremor-content-subtle">Сумма на согласовании</Text>
          <Metric className="text-amber-500">{formatMoney(totalPendingAmount)}</Metric>
        </Card>
        <Card>
          <Text className="text-tremor-content-subtle">Решено</Text>
          <Metric className="text-success">{resolved.length}</Metric>
        </Card>
      </Grid>

      {/* Pending approvals */}
      <Card>
        <Text className="text-tremor-content font-medium mb-4">Очередь согласования</Text>
        <List>
          {pending.map((approval, i) => {
            const Icon = typeIcons[approval.type]
            const cfg = statusBadge[approval.status]
            return (
              <motion.div
                key={approval.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <ListItem>
                  <Flex justifyContent="between" alignItems="center">
                    <Flex alignItems="center" className="gap-3">
                      <div className="h-9 w-9 rounded-lg bg-tremor-background-muted flex items-center justify-center">
                        <Icon className="h-4 w-4 text-tremor-content-subtle" />
                      </div>
                      <div>
                        <Flex alignItems="center" className="gap-2">
                          <Text className="text-tremor-content font-medium">{approval.title}</Text>
                          <Badge size="xs" color={cfg.color}>
                            {cfg.label}
                          </Badge>
                        </Flex>
                        <Flex alignItems="center" className="gap-3 mt-1">
                          <Flex alignItems="center" className="gap-1">
                            <User className="h-3 w-3 text-tremor-content-subtle" />
                            <Text className="text-tremor-content-subtle text-xs">{approval.requester}</Text>
                          </Flex>
                          <Flex alignItems="center" className="gap-1">
                            <Calendar className="h-3 w-3 text-tremor-content-subtle" />
                            <Text className="text-tremor-content-subtle text-xs">{approval.date}</Text>
                          </Flex>
                          <Badge size="xs" color="gray">
                            {typeLabels[approval.type]}
                          </Badge>
                        </Flex>
                      </div>
                    </Flex>
                    <Flex alignItems="center" className="gap-3">
                      <Text className="text-tremor-content tabular-nums font-medium">
                        {formatMoney(approval.amount)}
                      </Text>
                      <Flex className="gap-1">
                        <Button
                          variant="primary"
                          size="xs"
                          icon={ThumbsUp}
                          onClick={() => handleAction(approval.id, 'approved')}
                        >
                          Согласовать
                        </Button>
                        <Button
                          variant="secondary"
                          size="xs"
                          icon={ThumbsDown}
                          onClick={() => handleAction(approval.id, 'rejected')}
                        >
                          Отклонить
                        </Button>
                      </Flex>
                    </Flex>
                  </Flex>
                </ListItem>
              </motion.div>
            )
          })}
        </List>
        {pending.length === 0 && (
          <Flex justifyContent="center" className="py-8">
            <Text className="text-tremor-content-subtle">Нет документов на согласовании</Text>
          </Flex>
        )}
      </Card>

      {/* Resolved approvals */}
      {resolved.length > 0 && (
        <Card>
          <Text className="text-tremor-content font-medium mb-4">Рассмотренные</Text>
          <List>
            {resolved.map((approval, i) => {
              const Icon = typeIcons[approval.type]
              const cfg = statusBadge[approval.status]
              return (
                <motion.div
                  key={approval.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <ListItem>
                    <Flex justifyContent="between" alignItems="center">
                      <Flex alignItems="center" className="gap-3">
                        <div className="h-9 w-9 rounded-lg bg-tremor-background-muted flex items-center justify-center">
                          <Icon className="h-4 w-4 text-tremor-content-subtle" />
                        </div>
                        <div>
                          <Flex alignItems="center" className="gap-2">
                            <Text className="text-tremor-content-subtle font-medium">{approval.title}</Text>
                            <Badge size="xs" color={cfg.color}>
                              {cfg.label}
                            </Badge>
                          </Flex>
                          <Text className="text-tremor-content-subtle text-xs mt-1">
                            {approval.requester} · {approval.date}
                          </Text>
                        </div>
                      </Flex>
                      <Text className="text-tremor-content-subtle tabular-nums text-sm">
                        {formatMoney(approval.amount)}
                      </Text>
                    </Flex>
                  </ListItem>
                </motion.div>
              )
            })}
          </List>
        </Card>
      )}
    </motion.div>
  )
}
