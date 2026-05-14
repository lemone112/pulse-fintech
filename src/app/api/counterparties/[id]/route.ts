import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/counterparties/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const counterparty = await db.counterparty.findUnique({
      where: { id },
      include: {
        transactions: {
          include: {
            category: { select: { id: true, name: true } },
            account: { select: { id: true, name: true } },
          },
          orderBy: { transactionDate: 'desc' },
          take: 20,
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        documents: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: {
          select: { transactions: true, invoices: true, documents: true },
        },
      },
    })

    if (!counterparty) {
      return NextResponse.json({ error: 'Counterparty not found' }, { status: 404 })
    }

    // Compute totals
    const totalIncome = counterparty.transactions
      .filter((t) => t.type === 'INCOME' && t.status === 'COMPLETED')
      .reduce((sum, t) => sum + t.amount, 0)
    const totalExpense = counterparty.transactions
      .filter((t) => t.type === 'EXPENSE' && t.status === 'COMPLETED')
      .reduce((sum, t) => sum + t.amount, 0)

    return NextResponse.json({
      data: { ...counterparty, totalIncome, totalExpense },
    })
  } catch (error) {
    console.error('[API] GET /counterparties/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch counterparty' }, { status: 500 })
  }
}

// PUT /api/counterparties/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.counterparty.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Counterparty not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.inn !== undefined) updateData.inn = body.inn || null
    if (body.type !== undefined) updateData.type = body.type
    if (body.email !== undefined) updateData.email = body.email || null
    if (body.phone !== undefined) updateData.phone = body.phone || null
    if (body.address !== undefined) updateData.address = body.address || null
    if (body.contactPerson !== undefined) updateData.contactPerson = body.contactPerson || null
    if (body.notes !== undefined) updateData.notes = body.notes || null

    const counterparty = await db.counterparty.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ data: counterparty })
  } catch (error) {
    console.error('[API] PUT /counterparties/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update counterparty' }, { status: 500 })
  }
}

// DELETE /api/counterparties/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.counterparty.findUnique({
      where: { id },
      include: { _count: { select: { transactions: true, invoices: true } } },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Counterparty not found' }, { status: 404 })
    }

    if (existing._count.transactions > 0 || existing._count.invoices > 0) {
      return NextResponse.json(
        { error: 'Cannot delete counterparty with existing transactions or invoices' },
        { status: 400 }
      )
    }

    await db.counterparty.delete({ where: { id } })

    return NextResponse.json({ data: { id }, deleted: true })
  } catch (error) {
    console.error('[API] DELETE /counterparties/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete counterparty' }, { status: 500 })
  }
}
