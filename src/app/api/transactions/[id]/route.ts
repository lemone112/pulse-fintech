import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/transactions/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const transaction = await db.transaction.findUnique({
      where: { id },
      include: {
        account: { select: { id: true, name: true, currency: true, type: true } },
        counterparty: { select: { id: true, name: true, inn: true, type: true } },
        category: { select: { id: true, name: true, color: true, icon: true, type: true } },
        project: { select: { id: true, name: true, status: true } },
        invoice: { select: { id: true, number: true, status: true } },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    return NextResponse.json({ data: transaction })
  } catch (error) {
    console.error('[API] GET /transactions/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch transaction' }, { status: 500 })
  }
}

// PUT /api/transactions/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.transaction.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (body.accountId !== undefined) updateData.accountId = body.accountId
    if (body.counterpartyId !== undefined) updateData.counterpartyId = body.counterpartyId || null
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId || null
    if (body.projectId !== undefined) updateData.projectId = body.projectId || null
    if (body.invoiceId !== undefined) updateData.invoiceId = body.invoiceId || null
    if (body.type !== undefined) updateData.type = body.type
    if (body.amount !== undefined) updateData.amount = parseFloat(body.amount)
    if (body.description !== undefined) updateData.description = body.description || null
    if (body.reference !== undefined) updateData.reference = body.reference || null
    if (body.status !== undefined) updateData.status = body.status
    if (body.transactionDate !== undefined) updateData.transactionDate = new Date(body.transactionDate)

    const transaction = await db.transaction.update({
      where: { id },
      data: updateData,
      include: {
        account: { select: { id: true, name: true, currency: true } },
        counterparty: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, color: true, icon: true } },
        project: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ data: transaction })
  } catch (error) {
    console.error('[API] PUT /transactions/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
  }
}

// DELETE /api/transactions/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.transaction.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    await db.transaction.delete({ where: { id } })

    return NextResponse.json({ data: { id }, deleted: true })
  } catch (error) {
    console.error('[API] DELETE /transactions/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
  }
}
