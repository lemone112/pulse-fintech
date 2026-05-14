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
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Divider,
} from '@tremor/react'
import {
  Plus,
  FileText,
  Calendar,
  User,
  MoreHorizontal,
} from 'lucide-react'
import { formatMoney } from '@/lib/utils'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue'

const statusColor: Record<InvoiceStatus, 'gray' | 'blue' | 'emerald' | 'red'> = {
  draft: 'gray',
  sent: 'blue',
  paid: 'emerald',
  overdue: 'red',
}

const statusLabel: Record<InvoiceStatus, string> = {
  draft: 'Черновик',
  sent: 'Отправлен',
  paid: 'Оплачен',
  overdue: 'Просрочен',
}

const DEMO_INVOICES = [
  { id: 'СЧ-001', counterparty: 'ООО «Альфа»', amount: 350000, dueDate: '15.03.2025', status: 'paid' as InvoiceStatus, description: 'Оплата по договору №1245' },
  { id: 'СЧ-002', counterparty: 'ИП Петров А.С.', amount: 120000, dueDate: '20.03.2025', status: 'sent' as InvoiceStatus, description: 'Аренда офиса март' },
  { id: 'СЧ-003', counterparty: 'ООО «Бета»', amount: 85000, dueDate: '10.03.2025', status: 'overdue' as InvoiceStatus, description: 'Консультационные услуги' },
  { id: 'СЧ-004', counterparty: 'ПАО «Дельта»', amount: 275000, dueDate: '25.03.2025', status: 'sent' as InvoiceStatus, description: 'Лицензионные платежи Q1' },
  { id: 'СЧ-005', counterparty: 'ООО «Гамма»', amount: 420000, dueDate: '30.03.2025', status: 'draft' as InvoiceStatus, description: 'Проектная оплата этап 2' },
  { id: 'СЧ-006', counterparty: 'ООО «Вектор»', amount: 530000, dueDate: '01.04.2025', status: 'sent' as InvoiceStatus, description: 'Разработка платформы' },
  { id: 'СЧ-007', counterparty: 'ООО «Зета»', amount: 190000, dueDate: '05.03.2025', status: 'paid' as InvoiceStatus, description: 'Аудиторские услуги' },
  { id: 'СЧ-008', counterparty: 'ООО «Каппа»', amount: 310000, dueDate: '28.02.2025', status: 'overdue' as InvoiceStatus, description: 'Серверное оборудование' },
  { id: 'СЧ-009', counterparty: 'ООО «Лямбда»', amount: 165000, dueDate: '15.04.2025', status: 'draft' as InvoiceStatus, description: 'Сопровождение ПО' },
  { id: 'СЧ-010', counterparty: 'ООО «Сигма»', amount: 780000, dueDate: '12.03.2025', status: 'paid' as InvoiceStatus, description: 'Интеграционный проект' },
  { id: 'СЧ-011', counterparty: 'ИП Сидорова М.В.', amount: 95000, dueDate: '22.03.2025', status: 'sent' as InvoiceStatus, description: 'Дизайн интерфейсов' },
  { id: 'СЧ-012', counterparty: 'ООО «Омега»', amount: 240000, dueDate: '18.03.2025', status: 'paid' as InvoiceStatus, description: 'Техническая поддержка' },
]

const TABS = [
  { key: 'all', label: 'Все' },
  { key: 'draft', label: 'Черновики' },
  { key: 'sent', label: 'Отправленные' },
  { key: 'paid', label: 'Оплаченные' },
  { key: 'overdue', label: 'Просроченные' },
]

export default function InvoicesPage() {
  const [tabIndex, setTabIndex] = useState(0)

  const filtered =
    tabIndex === 0
      ? DEMO_INVOICES
      : DEMO_INVOICES.filter((inv) => inv.status === TABS[tabIndex].key)

  const totalPaid = DEMO_INVOICES.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const totalPending = DEMO_INVOICES.filter((i) => i.status === 'sent').reduce((s, i) => s + i.amount, 0)
  const totalOverdue = DEMO_INVOICES.filter((i) => i.status === 'overdue').reduce((s, i) => s + i.amount, 0)

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 space-y-6">
      {/* Header */}
      <Flex justifyContent="between" alignItems="center">
        <Flex flexDirection="col">
          <Title>Счета</Title>
          <Text className="text-tremor-content-subtle mt-1">Управление счетами на оплату</Text>
        </Flex>
        <Button variant="primary" size="sm" icon={Plus}>
          Новый счёт
        </Button>
      </Flex>

      {/* KPI Cards */}
      <Grid numItems={1} numItemsSm={3} className="gap-4">
        <Card>
          <Text className="text-tremor-content-subtle">Оплачено</Text>
          <Metric className="text-success">{formatMoney(totalPaid)}</Metric>
          <Text className="text-tremor-content-subtle mt-1">
            {DEMO_INVOICES.filter((i) => i.status === 'paid').length} счетов
          </Text>
        </Card>
        <Card>
          <Text className="text-tremor-content-subtle">Ожидает оплаты</Text>
          <Metric className="text-info">{formatMoney(totalPending)}</Metric>
          <Text className="text-tremor-content-subtle mt-1">
            {DEMO_INVOICES.filter((i) => i.status === 'sent').length} счетов
          </Text>
        </Card>
        <Card>
          <Text className="text-tremor-content-subtle">Просрочено</Text>
          <Metric className="text-danger">{formatMoney(totalOverdue)}</Metric>
          <Text className="text-tremor-content-subtle mt-1">
            {DEMO_INVOICES.filter((i) => i.status === 'overdue').length} счетов
          </Text>
        </Card>
      </Grid>

      {/* Tabs + List */}
      <Card>
        <TabGroup index={tabIndex} onIndexChange={setTabIndex}>
          <TabList>
            {TABS.map((t) => (
              <Tab key={t.key}>{t.label}</Tab>
            ))}
          </TabList>
          <TabPanels>
            {TABS.map((t) => (
              <TabPanel key={t.key}>
                <List className="mt-4">
                  {filtered.map((invoice, i) => (
                    <motion.div
                      key={invoice.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <ListItem>
                        <Flex justifyContent="between" alignItems="center">
                          <Flex alignItems="center" className="gap-3">
                            <div className="h-9 w-9 rounded-lg bg-tremor-background-muted flex items-center justify-center">
                              <FileText className="h-4 w-4 text-tremor-content-subtle" />
                            </div>
                            <div>
                              <Flex alignItems="center" className="gap-2">
                                <Text className="text-tremor-content font-medium">{invoice.id}</Text>
                                <Badge size="xs" color={statusColor[invoice.status]}>
                                  {statusLabel[invoice.status]}
                                </Badge>
                              </Flex>
                              <Flex alignItems="center" className="gap-3 mt-1">
                                <Flex alignItems="center" className="gap-1">
                                  <User className="h-3 w-3 text-tremor-content-subtle" />
                                  <Text className="text-tremor-content-subtle text-xs">{invoice.counterparty}</Text>
                                </Flex>
                                <Flex alignItems="center" className="gap-1">
                                  <Calendar className="h-3 w-3 text-tremor-content-subtle" />
                                  <Text className="text-tremor-content-subtle text-xs">до {invoice.dueDate}</Text>
                                </Flex>
                              </Flex>
                            </div>
                          </Flex>
                          <Flex alignItems="center" className="gap-3">
                            <div className="text-right">
                              <Text className="text-tremor-content tabular-nums font-medium">{formatMoney(invoice.amount)}</Text>
                              <Text className="text-tremor-content-subtle text-xs">{invoice.description}</Text>
                            </div>
                            <Button variant="light" size="xs" icon={MoreHorizontal} />
                          </Flex>
                        </Flex>
                      </ListItem>
                    </motion.div>
                  ))}
                </List>
                {filtered.length === 0 && (
                  <Flex justifyContent="center" className="py-8">
                    <Text className="text-tremor-content-subtle">Нет счетов в этой категории</Text>
                  </Flex>
                )}
              </TabPanel>
            ))}
          </TabPanels>
        </TabGroup>
      </Card>
    </motion.div>
  )
}
