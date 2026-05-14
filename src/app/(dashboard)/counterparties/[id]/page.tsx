'use client'

import { motion } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import {
  Card,
  Badge,
  Title,
  Text,
  Flex,
  Grid,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Divider,
  List,
  ListItem,
  Button,
} from '@tremor/react'
import {
  Building2,
  ArrowLeft,
  FileText,
  Receipt,
  Phone,
  Mail,
  Globe,
  MapPin,
} from 'lucide-react'
import { cn, formatMoney, formatSigned } from '@/lib/utils'
import { DocumentList } from '@/components/pulse/documents/document-list'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const COUNTERPARTY_DATA: Record<string, {
  name: string
  inn: string
  kind: string
  phone: string
  email: string
  website: string
  address: string
  balance: number
  totalIncome: number
  totalExpense: number
  transactionCount: number
}> = {
  '1': { name: 'ООО «Альфа»', inn: '7712345678', kind: 'Юридическое лицо', phone: '+7 (495) 123-45-67', email: 'info@alfa.ru', website: 'alfa.ru', address: 'г. Москва, ул. Примерная, д. 1', balance: 560000, totalIncome: 2100000, totalExpense: 1540000, transactionCount: 45 },
  '2': { name: 'ИП Петров А.С.', inn: '502345678901', kind: 'ИП', phone: '+7 (916) 987-65-43', email: 'petrov@mail.ru', website: '', address: 'г. Москва, ул. Тестовая, д. 5', balance: -120000, totalIncome: 500000, totalExpense: 620000, transactionCount: 12 },
}

const TRANSACTIONS = [
  { id: '1', date: '14 мая 2026', description: 'Оплата по счёту #1245', amount: 350000, direction: 'in' as const },
  { id: '2', date: '10 мая 2026', description: 'Аванс по договору #78', amount: 150000, direction: 'in' as const },
  { id: '3', date: '5 мая 2026', description: 'Возврат переплаты', amount: 60000, direction: 'out' as const },
  { id: '4', date: '28 апр 2026', description: 'Оплата услуг', amount: 200000, direction: 'in' as const },
  { id: '5', date: '15 апр 2026', description: 'Комиссия банка', amount: 1500, direction: 'out' as const },
]

export default function CounterpartyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const data = COUNTERPARTY_DATA[id] || COUNTERPARTY_DATA['1']

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 space-y-6">
      {/* Back + header */}
      <Flex alignItems="center" className="gap-4">
        <Button
          variant="light"
          size="sm"
          icon={ArrowLeft}
          onClick={() => router.push('/counterparties')}
          className="h-9 w-9 p-0"
        />
        <Flex alignItems="center" className="gap-3">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <Title>{data.name}</Title>
            <Text className="text-tremor-content-subtle text-sm">ИНН: {data.inn} · {data.kind}</Text>
          </div>
        </Flex>
      </Flex>

      {/* Quick stats */}
      <Grid numItems={3} className="gap-4">
        <Card>
          <Text className="text-tremor-content-subtle text-xs uppercase tracking-wider">Баланс</Text>
          <Text className={cn('text-xl tabular-nums font-semibold mt-1', data.balance >= 0 ? 'text-success' : 'text-danger')}>
            {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(data.balance)}
          </Text>
        </Card>
        <Card>
          <Text className="text-tremor-content-subtle text-xs uppercase tracking-wider">Доходы</Text>
          <Text className="text-xl tabular-nums font-semibold mt-1 text-success">
            {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(data.totalIncome)}
          </Text>
        </Card>
        <Card>
          <Text className="text-tremor-content-subtle text-xs uppercase tracking-wider">Расходы</Text>
          <Text className="text-xl tabular-nums font-semibold mt-1 text-danger">
            {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(data.totalExpense)}
          </Text>
        </Card>
      </Grid>

      {/* Tabs */}
      <TabGroup defaultIndex={0}>
        <TabList>
          <Tab>Информация</Tab>
          <Tab>Документы</Tab>
          <Tab>Операции</Tab>
        </TabList>

        <TabPanels>
          <TabPanel className="mt-4">
            <Card>
              <div className="space-y-4">
                <Grid numItems={2} className="gap-4">
                  <div className="space-y-1">
                    <Text className="text-tremor-content-subtle text-xs">Телефон</Text>
                    <Text className="text-sm flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{data.phone}</Text>
                  </div>
                  <div className="space-y-1">
                    <Text className="text-tremor-content-subtle text-xs">Email</Text>
                    <Text className="text-sm flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{data.email}</Text>
                  </div>
                  {data.website && (
                    <div className="space-y-1">
                      <Text className="text-tremor-content-subtle text-xs">Сайт</Text>
                      <Text className="text-sm flex items-center gap-2"><Globe className="h-3.5 w-3.5" />{data.website}</Text>
                    </div>
                  )}
                  <div className="space-y-1">
                    <Text className="text-tremor-content-subtle text-xs">Адрес</Text>
                    <Text className="text-sm flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{data.address}</Text>
                  </div>
                </Grid>
                <Divider />
                <Grid numItems={2} className="gap-4">
                  <div className="space-y-1">
                    <Text className="text-tremor-content-subtle text-xs">Количество операций</Text>
                    <Text className="text-sm font-medium">{data.transactionCount}</Text>
                  </div>
                  <div className="space-y-1">
                    <Text className="text-tremor-content-subtle text-xs">ИНН</Text>
                    <Text className="text-sm font-medium">{data.inn}</Text>
                  </div>
                </Grid>
              </div>
            </Card>
          </TabPanel>

          <TabPanel className="mt-4">
            <DocumentList counterpartyId={id} />
          </TabPanel>

          <TabPanel className="mt-4">
            <Card className="p-0">
              <List>
                {TRANSACTIONS.map((tx) => (
                  <ListItem key={tx.id} className="hover:bg-tremor-background-muted transition-colors">
                    <Flex justifyContent="between" alignItems="center">
                      <Flex alignItems="center" className="space-x-3">
                        <Badge
                          color={tx.direction === 'in' ? 'emerald' : 'red'}
                          size="xs"
                        >
                          {tx.direction === 'in' ? '↓' : '↑'}
                        </Badge>
                        <div>
                          <Text className="text-sm font-medium">{tx.description}</Text>
                          <Text className="text-tremor-content-subtle text-xs">{tx.date}</Text>
                        </div>
                      </Flex>
                      <Text className={cn(
                        'text-sm tabular-nums font-medium',
                        tx.direction === 'in' ? 'text-success' : 'text-danger',
                      )}>
                        {tx.direction === 'in' ? '+' : '−'}{new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(tx.amount)} ₽
                      </Text>
                    </Flex>
                  </ListItem>
                ))}
              </List>
            </Card>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </motion.div>
  )
}
