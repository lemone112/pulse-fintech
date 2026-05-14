import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/reports/trial-balance — Trial Balance report
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const organizationId = searchParams.get('organizationId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
    }

    const dateFilter: Record<string, unknown> = {}
    if (dateFrom) dateFilter.gte = new Date(dateFrom)
    if (dateTo) dateFilter.lte = new Date(dateTo)

    const transactionWhere: Record<string, unknown> = {
      organizationId,
      status: 'COMPLETED',
      type: { in: ['INCOME', 'EXPENSE'] },
      ...(Object.keys(dateFilter).length > 0 ? { transactionDate: dateFilter } : {}),
    }

    // Get categories with their transaction totals
    const categories = await db.category.findMany({
      where: { organizationId },
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { transactions: true } },
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    })

    // Aggregate transactions by category
    const categoryTotals = new Map<string, { debit: number; credit: number; count: number }>()

    const transactions = await db.transaction.findMany({
      where: transactionWhere,
      select: {
        categoryId: true,
        type: true,
        amount: true,
      },
    })

    for (const t of transactions) {
      const key = t.categoryId || 'uncategorized'
      const existing = categoryTotals.get(key)
      if (existing) {
        existing.count++
        if (t.type === 'EXPENSE') existing.debit += t.amount
        else existing.credit += t.amount
      } else {
        categoryTotals.set(key, {
          debit: t.type === 'EXPENSE' ? t.amount : 0,
          credit: t.type === 'INCOME' ? t.amount : 0,
          count: 1,
        })
      }
    }

    // Build trial balance rows
    const rows = categories.map((cat) => {
      const totals = categoryTotals.get(cat.id) || { debit: 0, credit: 0, count: 0 }
      return {
        id: cat.id,
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        color: cat.color,
        parent: cat.parent,
        debit: totals.debit,
        credit: totals.credit,
        balance: totals.debit - totals.credit,
        transactionCount: totals.count,
      }
    })

    // Add uncategorized row if needed
    const uncategorized = categoryTotals.get('uncategorized')
    if (uncategorized) {
      rows.push({
        id: 'uncategorized',
        name: 'Без категории',
        type: 'EXPENSE',
        icon: null,
        color: null,
        parent: null,
        debit: uncategorized.debit,
        credit: uncategorized.credit,
        balance: uncategorized.debit - uncategorized.credit,
        transactionCount: uncategorized.count,
      })
    }

    const totalDebit = rows.reduce((sum, r) => sum + r.debit, 0)
    const totalCredit = rows.reduce((sum, r) => sum + r.credit, 0)

    return NextResponse.json({
      data: {
        period: { from: dateFrom || null, to: dateTo || null },
        rows,
        totals: {
          debit: totalDebit,
          credit: totalCredit,
          difference: totalDebit - totalCredit,
          isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
        },
      },
    })
  } catch (error) {
    console.error('[API] GET /reports/trial-balance error:', error)
    return NextResponse.json({ error: 'Failed to generate trial balance' }, { status: 500 })
  }
}
