import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/reports/balance — Balance Sheet (simplified)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const organizationId = searchParams.get('organizationId')
    const dateTo = searchParams.get('dateTo')

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
    }

    // === ASSETS ===
    // Get all accounts with balances (these represent assets)
    const accounts = await db.account.findMany({
      where: { organizationId },
      select: { id: true, name: true, type: true, balance: true, currency: true },
      orderBy: { name: 'asc' },
    })

    const totalAssets = accounts.reduce((sum, a) => sum + a.balance, 0)

    // Group assets by type
    const assetsByType = new Map<string, { type: string; accounts: typeof accounts; total: number }>()
    for (const account of accounts) {
      const existing = assetsByType.get(account.type)
      if (existing) {
        existing.accounts.push(account)
        existing.total += account.balance
      } else {
        assetsByType.set(account.type, { type: account.type, accounts: [account], total: account.balance })
      }
    }

    // === INCOME & EXPENSE (simplified equity calculation) ===
    const transactionWhere: Record<string, unknown> = {
      organizationId,
      status: 'COMPLETED',
      type: { in: ['INCOME', 'EXPENSE'] },
    }
    if (dateTo) {
      transactionWhere.transactionDate = { lte: new Date(dateTo) }
    }

    const incomeAggregate = await db.transaction.aggregate({
      where: { ...transactionWhere, type: 'INCOME' },
      _sum: { amount: true },
    })

    const expenseAggregate = await db.transaction.aggregate({
      where: { ...transactionWhere, type: 'EXPENSE' },
      _sum: { amount: true },
    })

    const totalIncome = incomeAggregate._sum.amount || 0
    const totalExpense = expenseAggregate._sum.amount || 0
    const retainedEarnings = totalIncome - totalExpense

    // Receivables: outstanding sales invoices
    const receivables = await db.invoice.aggregate({
      where: {
        organizationId,
        type: 'SALES',
        status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] },
        ...(dateTo ? { issuedDate: { lte: new Date(dateTo) } } : {}),
      },
      _sum: { amount: true },
    })

    // Payables: outstanding purchase invoices
    const payables = await db.invoice.aggregate({
      where: {
        organizationId,
        type: 'PURCHASE',
        status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] },
        ...(dateTo ? { issuedDate: { lte: new Date(dateTo) } } : {}),
      },
      _sum: { amount: true },
    })

    const totalReceivables = receivables._sum.amount || 0
    const totalPayables = payables._sum.amount || 0

    return NextResponse.json({
      data: {
        asOf: dateTo || new Date().toISOString().split('T')[0],
        assets: {
          total: totalAssets + totalReceivables,
          accounts: Array.from(assetsByType.values()),
          receivables: totalReceivables,
          cashAndBank: totalAssets,
        },
        liabilities: {
          total: totalPayables,
          payables: totalPayables,
        },
        equity: {
          total: retainedEarnings,
          retainedEarnings,
        },
        totalLiabilitiesAndEquity: totalPayables + retainedEarnings,
        check: (totalAssets + totalReceivables) === (totalPayables + retainedEarnings),
      },
    })
  } catch (error) {
    console.error('[API] GET /reports/balance error:', error)
    return NextResponse.json({ error: 'Failed to generate balance sheet' }, { status: 500 })
  }
}
