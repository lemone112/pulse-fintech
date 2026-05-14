'use client'

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
  Divider,
  Button,
} from '@tremor/react'
import { Calendar, CreditCard, AlertCircle, Banknote, FileCheck, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const rub = (v: number) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(v)

type EventType = 'invoice' | 'tax' | 'salary' | 'dividend' | 'edo'

const eventTypeConfig: Record<EventType, { label: string; color: 'blue' | 'red' | 'emerald' | 'amber' | 'gray'; icon: typeof CreditCard }> = {
  invoice: { label: 'Оплата счёта', color: 'blue', icon: CreditCard },
  tax: { label: 'Налоговый платёж', color: 'red', icon: AlertCircle },
  salary: { label: 'Зарплата', color: 'emerald', icon: Banknote },
  dividend: { label: 'Дивиденды', color: 'amber', icon: Banknote },
  edo: { label: 'Срок ЭДО', color: 'gray', icon: FileCheck },
}

interface CalendarEvent {
  id: string
  date: string
  title: string
  type: EventType
  amount?: number
  counterparty?: string
  week: number
}

const events: CalendarEvent[] = [
  { id: '1', date: '05.05', title: 'Зарплата за апрель', type: 'salary', amount: 700_000, week: 1 },
  { id: '2', date: '07.05', title: 'Оплата счёта ООО «ТехноСнаб»', type: 'invoice', amount: 320_000, counterparty: 'ООО «ТехноСнаб»', week: 1 },
  { id: '3', date: '10.05', title: 'НДС за Q1', type: 'tax', amount: 416_000, week: 2 },
  { id: '4', date: '12.05', title: 'Срок ЭДО: счёт №1247', type: 'edo', week: 2 },
  { id: '5', date: '15.05', title: 'Оплата аренды', type: 'invoice', amount: 150_000, counterparty: 'ИП Сидоров', week: 3 },
  { id: '6', date: '18.05', title: 'Оплата счёта «КлаудСервис»', type: 'invoice', amount: 40_000, counterparty: 'ООО «КлаудСервис»', week: 3 },
  { id: '7', date: '20.05', title: 'Налог на прибыль (аванс)', type: 'tax', amount: 208_000, week: 4 },
  { id: '8', date: '22.05', title: 'Срок ЭДО: счёт №1253', type: 'edo', week: 4 },
  { id: '9', date: '25.05', title: 'Дивиденды за Q1', type: 'dividend', amount: 500_000, week: 4 },
  { id: '10', date: '28.05', title: 'Оплата счёта «ОфисМаркет»', type: 'invoice', amount: 35_000, counterparty: 'ООО «ОфисМаркет»', week: 5 },
  { id: '11', date: '30.05', title: 'Подписки (месяц)', type: 'invoice', amount: 40_000, week: 5 },
  { id: '12', date: '31.05', title: 'Зарплата за май', type: 'salary', amount: 700_000, week: 5 },
]

const weekLabels = ['1-4 мая', '5-11 мая', '12-18 мая', '19-25 мая', '26-31 мая']

const totalEvents = events.length
const payableEvents = events.filter((e) => e.amount)
const totalPayable = payableEvents.reduce((s, e) => s + (e.amount ?? 0), 0)

export default function CalendarPage() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 space-y-6">
      {/* Header */}
      <Flex justifyContent="between" alignItems="center">
        <div>
          <Title>Финансовый календарь</Title>
          <Text className="text-tremor-content-subtle mt-1">Май 2026</Text>
        </div>
        <Button variant="primary" size="sm" icon={Plus}>
          Событие
        </Button>
      </Flex>

      {/* KPI cards */}
      <Grid numItems={1} numItemsSm={3} className="gap-4">
        <Card>
          <Flex alignItems="center" className="gap-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            <Text className="text-tremor-content-subtle">Всего событий</Text>
          </Flex>
          <Metric>{totalEvents}</Metric>
        </Card>
        <Card>
          <Flex alignItems="center" className="gap-2">
            <CreditCard className="h-4 w-4 text-amber-500" />
            <Text className="text-tremor-content-subtle">К оплате</Text>
          </Flex>
          <Metric>{payableEvents.length}</Metric>
        </Card>
        <Card>
          <Flex alignItems="center" className="gap-2">
            <Banknote className="h-4 w-4 text-emerald-500" />
            <Text className="text-tremor-content-subtle">Сумма к оплате</Text>
          </Flex>
          <Metric>{rub(totalPayable)}</Metric>
        </Card>
      </Grid>

      {/* Events by week */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((week) => {
          const weekEvents = events.filter((e) => e.week === week)
          if (weekEvents.length === 0) return null
          return (
            <motion.div
              key={week}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: week * 0.08 }}
            >
              <Card>
                <Flex alignItems="center" className="mb-3 px-4 pt-4">
                  <Text className="text-tremor-content font-semibold">{weekLabels[week - 1]}</Text>
                  <Badge color="gray" size="sm">
                    {weekEvents.length} {weekEvents.length === 1 ? 'событие' : 'событий'}
                  </Badge>
                </Flex>
                <List>
                  {weekEvents.map((event) => {
                    const config = eventTypeConfig[event.type]
                    const Icon = config.icon
                    return (
                      <ListItem key={event.id}>
                        <Flex alignItems="center" justifyContent="between">
                          <Flex alignItems="center" className="gap-3">
                            <div className={cn(
                              'flex h-8 w-8 items-center justify-center rounded-md',
                              event.type === 'invoice' && 'bg-blue-50 text-blue-600',
                              event.type === 'tax' && 'bg-red-50 text-red-600',
                              event.type === 'salary' && 'bg-emerald-50 text-emerald-600',
                              event.type === 'dividend' && 'bg-amber-50 text-amber-600',
                              event.type === 'edo' && 'bg-gray-50 text-gray-600',
                            )}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <Text className="text-tremor-content text-sm font-medium">{event.title}</Text>
                              <Flex alignItems="center" className="gap-2 mt-0.5">
                                <Text className="text-tremor-content-subtle text-xs">{event.date}</Text>
                                {event.counterparty && (
                                  <Text className="text-tremor-content-subtle text-xs">· {event.counterparty}</Text>
                                )}
                              </Flex>
                            </div>
                          </Flex>
                          <Flex alignItems="center" className="gap-2">
                            {event.amount && (
                              <Text className="text-tremor-content tabular-nums font-medium text-sm">
                                {rub(event.amount)}
                              </Text>
                            )}
                            <Badge color={config.color} size="sm">
                              {config.label}
                            </Badge>
                          </Flex>
                        </Flex>
                      </ListItem>
                    )
                  })}
                </List>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
