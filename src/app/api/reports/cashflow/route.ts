import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/reports/cashflow — Cash Flow report
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const organizationId = searchParams.get('organizationId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const accountId = searchParams.get('accountId')
    const groupBy = searchParams.get('groupBy') || 'month' // day | week | month

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
      ...(accountId ? { accountId } : {}),
    }

    const transactions = await db.transaction.findMany({
      where: transactionWhere,
      select: {
        type: true,
        amount: true,
        transactionDate: true,
        account: { select: { id: true, name: true } },
      },
      orderBy: { transactionDate: 'asc' },
    })

    // Group transactions by period
    const periods = new Map<string, { period: string; inflow: number; outflow: number; net: number }>()

    for (const t of transactions) {
      const date = new Date(t.transactionDate)
      let key: string

      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0]
      } else if (groupBy === 'week') {
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().split('T')[0]
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      }

      const existing = periods.get(key)
      if (existing) {
        if (t.type === 'INCOME') existing.inflow += t.amount
        else existing.outflow += t.amount
        existing.net = existing.inflow - existing.outflow
      } else {
        const inflow = t.type === 'INCOME' ? t.amount : 0
        const outflow = t.type === 'EXPENSE' ? t.amount : 0
        periods.set(key, { period: key, inflow, outflow, net: inflow - outflow })
      }
    }

    // Sort by period
    const sortedPeriods = Array.from(periods.values()).sort((a, b) =>
      a.period.localeCompare(b.period)
    )

    // Compute running balance
    let runningBalance = 0
    const cashflow = sortedPeriods.map((p) => {
      runningBalance += p.net
      return { ...p, cumulativeBalance: runningBalance }
    })

    // Get current account balances
    const accounts = await db.account.findMany({
      where: { organizationId },
      select: { id: true, name: true, balance: true, currency: true, type: true },
    })

    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)
    const totalInflow = sortedPeriods.reduce((sum, p) => sum + p.inflow, 0)
    const totalOutflow = sortedPeriods.reduce((sum, p) => sum + p.outflow, 0)

    return NextResponse.json({
      data: {
        period: { from: dateFrom || null, to: dateTo || null },
        groupBy,
        totalBalance,
        totalInflow,
        totalOutflow,
        netCashflow: totalInflow - totalOutflow,
        accounts,
        cashflow,
      },
    })
  } catch (error) {
    console.error('[API] GET /reports/cashflow error:', error)
    return NextResponse.json({ error: 'Failed to generate cashflow report' }, { status: 500 })
  }
}
