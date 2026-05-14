// ============================================================================
// PULSE Audit Log — Tracks mutations for compliance and debugging
// ============================================================================

import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/server'

interface AuditLogInput {
  action: string        // e.g. 'CREATE', 'UPDATE', 'DELETE', 'APPROVE'
  entityType: string    // e.g. 'Transaction', 'Invoice', 'User'
  entityId?: string     // ID of the affected entity
  oldValue?: unknown    // Previous state (for updates)
  newValue?: unknown    // New state (for creates/updates)
  organizationId?: string // Override org ID if not from session
  userId?: string       // Override user ID if not from session
}

/**
 * Log an audit entry. Automatically captures userId and organizationId
 * from the current session if not provided.
 */
export async function logAudit(input: AuditLogInput): Promise<void> {
  try {
    // Try to get current user for automatic context
    let userId = input.userId
    let organizationId = input.organizationId

    if (!userId || !organizationId) {
      const user = await getCurrentUser().catch(() => null)
      if (user) {
        if (!userId) userId = user.id
        if (!organizationId) organizationId = user.organizationId
      }
    }

    await db.auditLog.create({
      data: {
        userId,
        organizationId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        oldValue: input.oldValue ? JSON.stringify(input.oldValue) : null,
        newValue: input.newValue ? JSON.stringify(input.newValue) : null,
      },
    })
  } catch (error) {
    // Audit logging should never break the main operation
    console.error('Failed to log audit entry:', error)
  }
}

/**
 * Common audit actions
 */
export const AuditActions = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  CANCEL: 'CANCEL',
  SIGN_IN: 'SIGN_IN',
  SIGN_OUT: 'SIGN_OUT',
  EXPORT: 'EXPORT',
  IMPORT: 'IMPORT',
} as const

/**
 * Entity types matching Prisma model names
 */
export const EntityTypes = {
  USER: 'User',
  ORGANIZATION: 'Organization',
  TRANSACTION: 'Transaction',
  INVOICE: 'Invoice',
  COUNTERPARTY: 'Counterparty',
  CATEGORY: 'Category',
  ACCOUNT: 'Account',
  PROJECT: 'Project',
  RULE: 'Rule',
  APPROVAL: 'Approval',
  DOCUMENT: 'Document',
} as const
