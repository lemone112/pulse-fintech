// ============================================================================
// PULSE Invoice State Machine — Enforces valid status transitions
// ============================================================================

import { db } from '@/lib/db'
import { logAudit, AuditActions, EntityTypes } from '@/lib/audit'

// Valid state transitions for Invoice
const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['SENT', 'CANCELLED'],
  SENT: ['PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED'],
  PARTIALLY_PAID: ['PAID', 'OVERDUE', 'CANCELLED'],
  OVERDUE: ['PAID', 'PARTIALLY_PAID', 'CANCELLED'],
  PAID: [],          // Terminal state
  CANCELLED: [],     // Terminal state (can be reopened to DRAFT only via admin action)
}

// Amount threshold above which transitions require approval
const APPROVAL_THRESHOLD = 100000 // 100 000 ₽

/**
 * Check if a transition from currentStatus to targetStatus is valid.
 */
export function canTransition(
  currentStatus: string,
  targetStatus: string
): boolean {
  const allowed = VALID_TRANSITIONS[currentStatus]
  if (!allowed) return false
  return allowed.includes(targetStatus)
}

/**
 * Get all valid target statuses from the current status.
 */
export function getValidTransitions(currentStatus: string): string[] {
  return VALID_TRANSITIONS[currentStatus] || []
}

/**
 * Check if a transition requires approval (based on invoice amount).
 */
export function requiresApproval(currentStatus: string, targetStatus: string, amount: number): boolean {
  // Approval is required for high-value invoices when moving to paid/cancelled
  if (amount > APPROVAL_THRESHOLD) {
    const approvalRequiredTransitions = ['PAID', 'CANCELLED']
    return approvalRequiredTransitions.includes(targetStatus)
  }
  return false
}

/**
 * Execute a state transition on an invoice.
 * Validates the transition, updates the invoice, and logs an audit entry.
 *
 * @throws Error if transition is invalid
 */
export async function transition(
  invoiceId: string,
  targetStatus: string,
  userId: string,
  reason?: string
): Promise<unknown> {
  // Fetch current invoice
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
  })

  if (!invoice) {
    throw new Error(`Счёт не найден: ${invoiceId}`)
  }

  const currentStatus = invoice.status

  // Validate transition
  if (!canTransition(currentStatus, targetStatus)) {
    throw new Error(
      `Недопустимый переход статуса: ${currentStatus} → ${targetStatus}. ` +
      `Допустимые: ${getValidTransitions(currentStatus).join(', ') || 'нет'}`
    )
  }

  // Store previous state for audit
  const previousState = { status: currentStatus, amount: invoice.amount }

  // Update invoice
  const updated = await db.invoice.update({
    where: { id: invoiceId },
    data: {
      status: targetStatus,
      updatedAt: new Date(),
    },
    include: {
      counterparty: { select: { id: true, name: true } },
      transactions: { select: { id: true, amount: true, status: true } },
    },
  })

  // Log audit entry
  await logAudit({
    action: AuditActions.UPDATE,
    entityType: EntityTypes.INVOICE,
    entityId: invoiceId,
    organizationId: invoice.organizationId,
    userId,
    oldValue: previousState,
    newValue: {
      status: targetStatus,
      reason: reason || null,
      requiresApproval: requiresApproval(currentStatus, targetStatus, invoice.amount),
    },
  })

  return updated
}

/**
 * Check if a status is a terminal state.
 */
export function isTerminalStatus(status: string): boolean {
  return VALID_TRANSITIONS[status]?.length === 0
}

/**
 * Get human-readable status label in Russian.
 */
export const INVOICE_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Черновик',
  SENT: 'Отправлен',
  PAID: 'Оплачен',
  PARTIALLY_PAID: 'Частично оплачен',
  OVERDUE: 'Просрочен',
  CANCELLED: 'Отменён',
}

/**
 * Status color mapping for UI
 */
export const INVOICE_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'gray',
  SENT: 'blue',
  PAID: 'green',
  PARTIALLY_PAID: 'yellow',
  OVERDUE: 'red',
  CANCELLED: 'gray',
}
