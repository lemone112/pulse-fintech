import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/reports/pnl — Profit & Loss report
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const organizationId = searchParams.get('organizationId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const projectId = searchParams.get('projectId')

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
    }

    const dateFilter: Record<string, unknown> = {}
    if (dateFrom) dateFilter.gte = new Date(dateFrom)
    if (dateTo) dateFilter.lte = new Date(dateTo)

    const transactionWhere: Record<string, unknown> = {
      organizationId,
      status: 'COMPLETED',
      ...(Object.keys(dateFilter).length > 0 ? { transactionDate: dateFilter } : {}),
      ...(projectId ? { projectId } : {}),
    }

    // Get income by category
    const incomeTransactions = await db.transaction.findMany({
      where: { ...transactionWhere, type: 'INCOME' },
      include: { category: { select: { id: true, name: true, color: true, icon: true } } },
    })

    // Get expense by category
    const expenseTransactions = await db.transaction.findMany({
      where: { ...transactionWhere, type: 'EXPENSE' },
      include: { category: { select: { id: true, name: true, color: true, icon: true } } },
    })

    // Aggregate by category
    const incomeByCategory = new Map<string, { category: { id: string; name: string; color: string | null; icon: string | null }; total: number }>()
    for (const t of incomeTransactions) {
      const key = t.categoryId || 'uncategorized'
      const existing = incomeByCategory.get(key)
      const catData = t.category ? { id: t.category.id, name: t.category.name, color: t.category.color, icon: t.category.icon } : { id: 'uncategorized', name: 'Без категории', color: null, icon: null }
      if (existing) {
        existing.total += t.amount
      } else {
        incomeByCategory.set(key, { category: catData, total: t.amount })
      }
    }

    const expenseByCategory = new Map<string, { category: { id: string; name: string; color: string | null; icon: string | null }; total: number }>()
    for (const t of expenseTransactions) {
      const key = t.categoryId || 'uncategorized'
      const existing = expenseByCategory.get(key)
      const catData = t.category ? { id: t.category.id, name: t.category.name, color: t.category.color, icon: t.category.icon } : { id: 'uncategorized', name: 'Без категории', color: null, icon: null }
      if (existing) {
        existing.total += t.amount
      } else {
        expenseByCategory.set(key, { category: catData, total: t.amount })
      }
    }

    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0)
    const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0)
    const netProfit = totalIncome - totalExpense
    const margin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0

    return NextResponse.json({
      data: {
        period: { from: dateFrom || null, to: dateTo || null },
        totalIncome,
        totalExpense,
        netProfit,
        margin: Math.round(margin * 100) / 100,
        income: Array.from(incomeByCategory.values()),
        expense: Array.from(expenseByCategory.values()),
      },
    })
  } catch (error) {
    console.error('[API] GET /reports/pnl error:', error)
    return NextResponse.json({ error: 'Failed to generate P&L report' }, { status: 500 })
  }
}
