// ============================================================================
// PULSE Export API — GET /api/export?type=...&format=...
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { exportToPDF } from '@/lib/export/pdf'
import { exportToExcelCSV } from '@/lib/export/excel'
import { exportToCSV } from '@/lib/export/csv'
import { logAudit, AuditActions, EntityTypes } from '@/lib/audit'

type ExportType = 'pnl' | 'cashflow' | 'balance' | 'transactions' | 'invoices'
type ExportFormat = 'pdf' | 'excel' | 'csv'

function getColumnConfig(type: ExportType): Array<{ key: string; label: string; align?: 'left' | 'right' | 'center' }> {
  switch (type) {
    case 'pnl':
      return [
        { key: 'category', label: 'Категория' },
        { key: 'planAmount', label: 'План', align: 'right' as const },
        { key: 'factAmount', label: 'Факт', align: 'right' as const },
        { key: 'variance', label: 'Отклонение', align: 'right' as const },
      ]
    case 'cashflow':
      return [
        { key: 'period', label: 'Период' },
        { key: 'inflow', label: 'Поступления', align: 'right' as const },
        { key: 'outflow', label: 'Выплаты', align: 'right' as const },
        { key: 'net', label: 'Сальдо', align: 'right' as const },
        { key: 'cumulative', label: 'Накопленный итог', align: 'right' as const },
      ]
    case 'balance':
      return [
        { key: 'section', label: 'Статья' },
        { key: 'amount', label: 'Сумма', align: 'right' as const },
      ]
    case 'transactions':
      return [
        { key: 'date', label: 'Дата' },
        { key: 'description', label: 'Описание' },
        { key: 'counterparty', label: 'Контрагент' },
        { key: 'category', label: 'Категория' },
        { key: 'type', label: 'Тип' },
        { key: 'amount', label: 'Сумма', align: 'right' as const },
        { key: 'status', label: 'Статус' },
      ]
    case 'invoices':
      return [
        { key: 'number', label: 'Номер' },
        { key: 'counterparty', label: 'Контрагент' },
        { key: 'amount', label: 'Сумма', align: 'right' as const },
        { key: 'status', label: 'Статус' },
        { key: 'dueDate', label: 'Срок оплаты' },
      ]
    default:
      return []
  }
}

const TITLES: Record<ExportType, string> = {
  pnl: 'Отчёт о прибылях и убытках',
  cashflow: 'Отчёт о движении денежных средств',
  balance: 'Баланс',
  transactions: 'Транзакции',
  invoices: 'Счета',
}

async function getExportData(type: ExportType, organizationId: string): Promise<Array<Record<string, unknown>>> {
  switch (type) {
    case 'transactions': {
      const transactions = await db.transaction.findMany({
        where: { organizationId },
        include: { counterparty: true, category: true },
        orderBy: { transactionDate: 'desc' },
        take: 10000,
      })
      return transactions.map((t) => ({
        date: t.transactionDate.toLocaleDateString('ru-RU'),
        description: t.description || '',
        counterparty: t.counterparty?.name || '',
        category: t.category?.name || '',
        type: t.type === 'INCOME' ? 'Доход' : t.type === 'EXPENSE' ? 'Расход' : 'Перевод',
        amount: t.amount,
        status: t.status === 'COMPLETED' ? 'Завершена' : t.status === 'PENDING' ? 'Ожидает' : 'Отменена',
      }))
    }
    case 'invoices': {
      const invoices = await db.invoice.findMany({
        where: { organizationId },
        include: { counterparty: true },
        orderBy: { createdAt: 'desc' },
        take: 10000,
      })
      return invoices.map((i) => ({
        number: i.number,
        counterparty: i.counterparty.name,
        amount: i.amount,
        status: i.status,
        dueDate: i.dueDate ? i.dueDate.toLocaleDateString('ru-RU') : '',
      }))
    }
    case 'pnl':
    case 'cashflow':
    case 'balance': {
      const transactions = await db.transaction.findMany({
        where: { organizationId, status: 'COMPLETED' },
        include: { category: true },
      })

      if (type === 'pnl') {
        const byCategory = new Map<string, { factAmount: number; category: string }>()
        for (const t of transactions) {
          const catName = t.category?.name || 'Без категории'
          const existing = byCategory.get(catName) || { factAmount: 0, category: catName }
          existing.factAmount += t.type === 'INCOME' ? t.amount : -t.amount
          byCategory.set(catName, existing)
        }
        return Array.from(byCategory.values()).map((item) => ({
          category: item.category,
          planAmount: 0,
          factAmount: item.factAmount,
          variance: -item.factAmount,
        }))
      }

      if (type === 'cashflow') {
        const byMonth = new Map<string, { inflow: number; outflow: number }>()
        for (const t of transactions) {
          const month = t.transactionDate.toISOString().slice(0, 7)
          const existing = byMonth.get(month) || { inflow: 0, outflow: 0 }
          if (t.type === 'INCOME') existing.inflow += t.amount
          else existing.outflow += t.amount
          byMonth.set(month, existing)
        }
        let cumulative = 0
        return Array.from(byMonth.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([period, data]) => {
            const net = data.inflow - data.outflow
            cumulative += net
            return { period, inflow: data.inflow, outflow: data.outflow, net, cumulative }
          })
      }

      // Balance sheet
      return [
        { section: 'Активы', amount: 0 },
        { section: 'Обязательства', amount: 0 },
        { section: 'Капитал', amount: 0 },
      ]
    }
    default:
      return []
  }
}

// GET /api/export?type=pnl|cashflow|balance|transactions|invoices&format=pdf|excel|csv
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as ExportType | null
    const format = searchParams.get('format') as ExportFormat | null
    const organizationId = searchParams.get('organizationId') || ''

    if (!type || !format) {
      return NextResponse.json(
        { error: 'Параметры type и format обязательны' },
        { status: 400 }
      )
    }

    const validTypes: ExportType[] = ['pnl', 'cashflow', 'balance', 'transactions', 'invoices']
    const validFormats: ExportFormat[] = ['pdf', 'excel', 'csv']

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Неверный тип экспорта: ${type}. Доступные: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { error: `Неверный формат: ${format}. Доступные: ${validFormats.join(', ')}` },
        { status: 400 }
      )
    }

    const data = await getExportData(type, organizationId)
    const columns = getColumnConfig(type)
    const title = TITLES[type]

    await logAudit({
      action: AuditActions.EXPORT,
      entityType: 'Report',
      newValue: { type, format, recordCount: data.length },
      organizationId,
    })

    switch (format) {
      case 'pdf': {
        const { html, filename } = exportToPDF({ title, data, columns })
        return new Response(html, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
          },
        })
      }

      case 'excel': {
        const { csv, filename } = exportToExcelCSV({ title, data, columns })
        return new Response(csv, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
          },
        })
      }

      case 'csv': {
        const { csv, filename } = exportToCSV({ title, data, columns })
        return new Response(csv, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
          },
        })
      }

      default:
        return NextResponse.json({ error: 'Неподдерживаемый формат' }, { status: 400 })
    }
  } catch (error) {
    console.error('[API] GET /export error:', error)
    return NextResponse.json({ error: 'Ошибка экспорта' }, { status: 500 })
  }
}
