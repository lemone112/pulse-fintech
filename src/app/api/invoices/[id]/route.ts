import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Valid invoice status transitions
const STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['SENT', 'CANCELLED'],
  SENT: ['PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED'],
  PARTIALLY_PAID: ['PAID', 'OVERDUE', 'CANCELLED'],
  OVERDUE: ['PAID', 'PARTIALLY_PAID', 'CANCELLED'],
  PAID: [],
  CANCELLED: ['DRAFT'],
}

// GET /api/invoices/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        counterparty: true,
        transactions: {
          include: {
            account: { select: { id: true, name: true } },
          },
          orderBy: { transactionDate: 'desc' },
        },
        documents: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const paidAmount = invoice.transactions
      .filter((t) => t.status === 'COMPLETED')
      .reduce((sum, t) => sum + t.amount, 0)

    return NextResponse.json({
      data: { ...invoice, paidAmount },
    })
  } catch (error) {
    console.error('[API] GET /invoices/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 })
  }
}

// PUT /api/invoices/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.invoice.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Handle status transition validation
    if (body.status && body.status !== existing.status) {
      const allowed = STATUS_TRANSITIONS[existing.status] || []
      if (!allowed.includes(body.status)) {
        return NextResponse.json(
          { error: `Invalid status transition: ${existing.status} → ${body.status}` },
          { status: 400 }
        )
      }
    }

    const updateData: Record<string, unknown> = {}
    if (body.counterpartyId !== undefined) updateData.counterpartyId = body.counterpartyId
    if (body.number !== undefined) updateData.number = body.number
    if (body.type !== undefined) updateData.type = body.type
    if (body.amount !== undefined) updateData.amount = parseFloat(body.amount)
    if (body.taxAmount !== undefined) updateData.taxAmount = body.taxAmount != null ? parseFloat(body.taxAmount) : null
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null
    if (body.issuedDate !== undefined) updateData.issuedDate = body.issuedDate ? new Date(body.issuedDate) : null
    if (body.description !== undefined) updateData.description = body.description || null
    if (body.status !== undefined) updateData.status = body.status

    const invoice = await db.invoice.update({
      where: { id },
      data: updateData,
      include: {
        counterparty: { select: { id: true, name: true } },
        transactions: { select: { id: true, amount: true, status: true } },
      },
    })

    return NextResponse.json({ data: invoice })
  } catch (error) {
    console.error('[API] PUT /invoices/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
  }
}

// DELETE /api/invoices/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.invoice.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Only allow deletion of DRAFT invoices
    if (existing.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Only DRAFT invoices can be deleted' },
        { status: 400 }
      )
    }

    await db.invoice.delete({ where: { id } })

    return NextResponse.json({ data: { id }, deleted: true })
  } catch (error) {
    console.error('[API] DELETE /invoices/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 })
  }
}
