import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/invoices — list with filters & pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const organizationId = searchParams.get('organizationId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const counterpartyId = searchParams.get('counterpartyId')
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

    if (status) where.status = status
    if (type) where.type = type
    if (counterpartyId) where.counterpartyId = counterpartyId
    if (dateFrom || dateTo) {
      where.issuedDate = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      }
    }

    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        where,
        include: {
          counterparty: { select: { id: true, name: true, inn: true } },
          transactions: { select: { id: true, amount: true, status: true } },
          documents: { select: { id: true, title: true, type: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.invoice.count({ where }),
    ])

    // Compute paid amount for each invoice
    const data = invoices.map((inv) => ({
      ...inv,
      paidAmount: inv.transactions
        .filter((t) => t.status === 'COMPLETED')
        .reduce((sum, t) => sum + t.amount, 0),
    }))

    return NextResponse.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('[API] GET /invoices error:', error)
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}

// POST /api/invoices — create an invoice
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      organizationId,
      counterpartyId,
      number,
      type,
      amount,
      taxAmount,
      dueDate,
      issuedDate,
      description,
      status,
    } = body

    if (!organizationId || !counterpartyId || !number || amount == null) {
      return NextResponse.json(
        { error: 'Missing required fields: organizationId, counterpartyId, number, amount' },
        { status: 400 }
      )
    }

    const invoice = await db.invoice.create({
      data: {
        organizationId,
        counterpartyId,
        number,
        type: type || 'SALES',
        amount: parseFloat(amount),
        taxAmount: taxAmount != null ? parseFloat(taxAmount) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        issuedDate: issuedDate ? new Date(issuedDate) : null,
        description: description || null,
        status: status || 'DRAFT',
      },
      include: {
        counterparty: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ data: invoice }, { status: 201 })
  } catch (error) {
    console.error('[API] POST /invoices error:', error)
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
}
