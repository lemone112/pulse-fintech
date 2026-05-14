import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { canTransition, transition, requiresApproval } from '@/lib/business/invoice-state-machine'
import { logAudit, AuditActions, EntityTypes } from '@/lib/audit'

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
      return NextResponse.json({ error: 'Счёт не найден' }, { status: 404 })
    }

    const paidAmount = invoice.transactions
      .filter((t) => t.status === 'COMPLETED')
      .reduce((sum, t) => sum + t.amount, 0)

    return NextResponse.json({
      data: { ...invoice, paidAmount },
    })
  } catch (error) {
    console.error('[API] GET /invoices/[id] error:', error)
    return NextResponse.json({ error: 'Не удалось загрузить счёт' }, { status: 500 })
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
      return NextResponse.json({ error: 'Счёт не найден' }, { status: 404 })
    }

    // Handle status transition using the state machine
    if (body.status && body.status !== existing.status) {
      // Validate transition
      if (!canTransition(existing.status, body.status)) {
        return NextResponse.json(
          { error: `Недопустимый переход статуса: ${existing.status} → ${body.status}` },
          { status: 400 }
        )
      }

      // Check if approval is required
      const needsApproval = requiresApproval(existing.status, body.status, existing.amount)
      if (needsApproval && !body._approvalId) {
        return NextResponse.json(
          {
            error: 'Для данного перехода требуется согласование (сумма > 100 000 ₽)',
            requiresApproval: true,
            currentStatus: existing.status,
            targetStatus: body.status,
          },
          { status: 403 }
        )
      }

      // Use state machine transition
      try {
        const userId = body._userId || 'system'
        const updated = await transition(id, body.status, userId, body.reason)
        return NextResponse.json({ data: updated })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Ошибка перехода статуса'
        return NextResponse.json({ error: message }, { status: 400 })
      }
    }

    // Non-status updates (e.g. amount, description, etc.)
    const updateData: Record<string, unknown> = {}
    if (body.counterpartyId !== undefined) updateData.counterpartyId = body.counterpartyId
    if (body.number !== undefined) updateData.number = body.number
    if (body.type !== undefined) updateData.type = body.type
    if (body.amount !== undefined) updateData.amount = parseFloat(body.amount)
    if (body.taxAmount !== undefined) updateData.taxAmount = body.taxAmount != null ? parseFloat(body.taxAmount) : null
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null
    if (body.issuedDate !== undefined) updateData.issuedDate = body.issuedDate ? new Date(body.issuedDate) : null
    if (body.description !== undefined) updateData.description = body.description || null

    const invoice = await db.invoice.update({
      where: { id },
      data: updateData,
      include: {
        counterparty: { select: { id: true, name: true } },
        transactions: { select: { id: true, amount: true, status: true } },
      },
    })

    // Log audit for non-status updates
    if (Object.keys(updateData).length > 0) {
      await logAudit({
        action: AuditActions.UPDATE,
        entityType: EntityTypes.INVOICE,
        entityId: id,
        organizationId: existing.organizationId,
        newValue: updateData,
      })
    }

    return NextResponse.json({ data: invoice })
  } catch (error) {
    console.error('[API] PUT /invoices/[id] error:', error)
    return NextResponse.json({ error: 'Не удалось обновить счёт' }, { status: 500 })
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
      return NextResponse.json({ error: 'Счёт не найден' }, { status: 404 })
    }

    // Only allow deletion of DRAFT invoices
    if (existing.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Можно удалить только счёт в статусе Черновик' },
        { status: 400 }
      )
    }

    await db.invoice.delete({ where: { id } })

    await logAudit({
      action: AuditActions.DELETE,
      entityType: EntityTypes.INVOICE,
      entityId: id,
      organizationId: existing.organizationId,
      oldValue: { number: existing.number, amount: existing.amount, status: existing.status },
    })

    return NextResponse.json({ data: { id }, deleted: true })
  } catch (error) {
    console.error('[API] DELETE /invoices/[id] error:', error)
    return NextResponse.json({ error: 'Не удалось удалить счёт' }, { status: 500 })
  }
}
