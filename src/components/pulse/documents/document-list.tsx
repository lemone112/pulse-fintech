'use client'

import { FileText } from 'lucide-react'
import { Flex, Text, Button } from '@tremor/react'
import { DocumentCard } from './document-card'
import { STATUS_MAP, TYPE_MAP } from './constants'

interface DocumentListProps {
  counterpartyId: string
}

const DEMO_DOCUMENTS = [
  { id: '1', title: 'Договор поставки #1245', type: 'contract', status: 'signed', date: '2026-01-15', size: '2.4 MB' },
  { id: '2', title: 'Счёт на оплату #SF-001', type: 'invoice', status: 'pending', date: '2026-05-10', size: '156 KB' },
  { id: '3', title: 'Акт выполненных работ #12', type: 'act', status: 'signed', date: '2026-04-28', size: '340 KB' },
  { id: '4', title: 'Счёт-фактура #45', type: 'invoice', status: 'paid', date: '2026-04-15', size: '210 KB' },
  { id: '5', title: 'Дополнительное соглашение #3', type: 'contract', status: 'draft', date: '2026-05-12', size: '1.1 MB' },
]

export function DocumentList({ counterpartyId }: DocumentListProps) {
  return (
    <div className="space-y-3">
      <Flex justifyContent="between" alignItems="center">
        <Text className="text-sm text-tremor-content-subtle">{DEMO_DOCUMENTS.length} документов</Text>
        <Button variant="secondary" size="sm" icon={FileText}>
          Загрузить
        </Button>
      </Flex>

      <div className="grid grid-cols-1 gap-3">
        {DEMO_DOCUMENTS.map((doc, i) => (
          <DocumentCard key={doc.id} document={doc} index={i} />
        ))}
      </div>
    </div>
  )
}
