import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/transactions — list with filters & pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const organizationId = searchParams.get('organizationId')
    const accountId = searchParams.get('accountId')
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const counterpartyId = searchParams.get('counterpartyId')
    const categoryId = searchParams.get('categoryId')
    const projectId = searchParams.get('projectId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
    }

    const where: Record<string, unknown> = {
      organizationId,
    }

    if (accountId) where.accountId = accountId
    if (type) where.type = type
    if (status) where.status = status
    if (counterpartyId) where.counterpartyId = counterpartyId
    if (categoryId) where.categoryId = categoryId
    if (projectId) where.projectId = projectId
    if (dateFrom || dateTo) {
      where.transactionDate = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      }
    }

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where,
        include: {
          account: { select: { id: true, name: true, currency: true } },
          counterparty: { select: { id: true, name: true } },
          category: { select: { id: true, name: true, color: true, icon: true } },
          project: { select: { id: true, name: true } },
          invoice: { select: { id: true, number: true } },
        },
        orderBy: { transactionDate: 'desc' },
        skip,
        take: limit,
      }),
      db.transaction.count({ where }),
    ])

    return NextResponse.json({
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[API] GET /transactions error:', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

// POST /api/transactions — create a transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      organizationId,
      accountId,
      counterpartyId,
      categoryId,
      projectId,
      invoiceId,
      type,
      amount,
      description,
      reference,
      status,
      transactionDate,
    } = body

    if (!organizationId || !accountId || !type || amount == null || !transactionDate) {
      return NextResponse.json(
        { error: 'Missing required fields: organizationId, accountId, type, amount, transactionDate' },
        { status: 400 }
      )
    }

    const transaction = await db.transaction.create({
      data: {
        organizationId,
        accountId,
        counterpartyId: counterpartyId || null,
        categoryId: categoryId || null,
        projectId: projectId || null,
        invoiceId: invoiceId || null,
        type,
        amount: parseFloat(amount),
        description: description || null,
        reference: reference || null,
        status: status || 'PENDING',
        transactionDate: new Date(transactionDate),
      },
      include: {
        account: { select: { id: true, name: true, currency: true } },
        counterparty: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, color: true, icon: true } },
        project: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ data: transaction }, { status: 201 })
  } catch (error) {
    console.error('[API] POST /transactions error:', error)
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
}
