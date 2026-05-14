'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Plus, Users, Building2, ArrowUpDown } from 'lucide-react'
import { Title, Text, Flex, Button, TextInput, Card, List, ListItem } from '@tremor/react'
import { cn, formatSigned } from '@/lib/utils'
import Link from 'next/link'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const DEMO_COUNTERPARTIES = [
  { id: '1', name: 'ООО «Альфа»', inn: '7712345678', kind: 'Юридическое лицо', balance: 560000, direction: 'in' as const },
  { id: '2', name: 'ИП Петров А.С.', inn: '502345678901', kind: 'ИП', balance: -120000, direction: 'out' as const },
  { id: '3', name: 'ООО «Бета»', inn: '7701234567', kind: 'Юридическое лицо', balance: 420000, direction: 'in' as const },
  { id: '4', name: 'ПАО «Дельта»', inn: '7709876543', kind: 'ПАО', balance: 190000, direction: 'in' as const },
  { id: '5', name: 'ООО «Гамма»', inn: '7745678901', kind: 'Юридическое лицо', balance: -45000, direction: 'out' as const },
  { id: '6', name: 'ИП Сидорова М.В.', inn: '506789012345', kind: 'ИП', balance: 85000, direction: 'in' as const },
  { id: '7', name: 'ООО «Омега»', inn: '7734567890', kind: 'Юридическое лицо', balance: 0, direction: 'in' as const },
  { id: '8', name: 'СКС Интернет', inn: '7711223344', kind: 'Юридическое лицо', balance: -15000, direction: 'out' as const },
]

export default function CounterpartiesPage() {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'balance'>('name')

  const filtered = DEMO_COUNTERPARTIES
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.inn.includes(search))
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name, 'ru')
      return Math.abs(b.balance) - Math.abs(a.balance)
    })

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 space-y-6">
      <Flex justifyContent="between" alignItems="center">
        <div>
          <Title>Контрагенты</Title>
          <Text className="text-tremor-content-subtle mt-1">Управление контрагентами и документами</Text>
        </div>
        <Button variant="primary" icon={Plus}>
          Добавить
        </Button>
      </Flex>

      {/* Search & filters */}
      <Flex alignItems="center" className="gap-3">
        <div className="flex-1 max-w-sm">
          <TextInput
            icon={Search}
            value={search}
            onValueChange={setSearch}
            placeholder="Поиск по названию или ИНН..."
          />
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={ArrowUpDown}
          onClick={() => setSortBy(sortBy === 'name' ? 'balance' : 'name')}
        >
          {sortBy === 'name' ? 'По имени' : 'По сумме'}
        </Button>
      </Flex>

      {/* List */}
      <Card className="p-0">
        <List>
          {filtered.map((counterparty, i) => (
            <motion.div
              key={counterparty.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                href={`/counterparties/${counterparty.id}`}
                className="block"
              >
                <ListItem className="hover:bg-tremor-background-muted transition-colors">
                  <Flex justifyContent="between" alignItems="center">
                    <Flex alignItems="center" className="space-x-3">
                      <div className="h-9 w-9 rounded-lg bg-tremor-brand-subtle flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-tremor-brand" />
                      </div>
                      <div>
                        <Text className="text-tremor-content">{counterparty.name}</Text>
                        <Text className="text-tremor-content-subtle text-xs">ИНН: {counterparty.inn} · {counterparty.kind}</Text>
                      </div>
                    </Flex>
                    <div className="text-right">
                      <Text className={cn(
                        'text-sm tabular-nums font-medium',
                        counterparty.balance > 0 && 'text-success',
                        counterparty.balance < 0 && 'text-danger',
                        counterparty.balance === 0 && 'text-tremor-content-subtle'
                      )}>
                        {formatSigned(counterparty.balance)}
                      </Text>
                      <Text className="text-tremor-content-subtle text-xs">
                        {counterparty.balance > 0 ? 'Нам должны' : counterparty.balance < 0 ? 'Мы должны' : 'Нет долга'}
                      </Text>
                    </div>
                  </Flex>
                </ListItem>
              </Link>
            </motion.div>
          ))}
        </List>
      </Card>
    </motion.div>
  )
}
