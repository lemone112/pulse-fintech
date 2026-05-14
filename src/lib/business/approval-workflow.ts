// ============================================================================
// PULSE Approval Workflow — Multi-step approval system
// ============================================================================
//
// Rules:
// 1. Create approval with ordered steps
// 2. Each step must be acted on in order
// 3. Approver can APPROVE or REJECT
// 4. If any step is REJECTED, the whole approval is REJECTED
// 5. If all steps are APPROVED, the approval is APPROVED

import { db } from '@/lib/db'
import { logAudit, AuditActions, EntityTypes } from '@/lib/audit'

// Types
export interface CreateApprovalInput {
  type: 'INVOICE' | 'EXPENSE' | 'TRANSFER' | 'BUDGET'
  entityType: string
  entityId: string
  organizationId: string
  steps: Array<{ approverId: string }>
  description?: string
}

export interface ActOnStepInput {
  stepId: string
  action: 'APPROVE' | 'REJECT'
  comment?: string
  userId: string
}

export interface ApprovalWithSteps {
  id: string
  type: string
  entityType: string
  entityId: string
  status: string
  organizationId: string
  createdAt: Date
  updatedAt: Date
  steps: Array<{
    id: string
    approvalId: string
    approverId: string
    status: string
    comment: string | null
    actedAt: Date | null
    approver: { id: string; name: string | null; email: string }
  }>
}

/**
 * Create a new approval with ordered steps.
 * Steps are created in the order provided — step 1 must be acted on first.
 */
export async function createApproval(input: CreateApprovalInput): Promise<ApprovalWithSteps> {
  if (input.steps.length === 0) {
    throw new Error('Необходима хотя бы одна ступень согласования')
  }

  const approval = await db.approval.create({
    data: {
      type: input.type,
      entityType: input.entityType,
      entityId: input.entityId,
      organizationId: input.organizationId,
      status: 'PENDING',
      steps: {
        create: input.steps.map((step, index) => ({
          approverId: step.approverId,
          status: index === 0 ? 'PENDING' : 'PENDING',
        })),
      },
    },
    include: {
      steps: {
        include: {
          approver: { select: { id: true, name: true, email: true } },
        },
        orderBy: { id: 'asc' },
      },
    },
  })

  await logAudit({
    action: AuditActions.CREATE,
    entityType: EntityTypes.APPROVAL,
    entityId: approval.id,
    organizationId: input.organizationId,
    newValue: {
      type: input.type,
      entityType: input.entityType,
      entityId: input.entityId,
      stepCount: input.steps.length,
    },
  })

  return approval as ApprovalWithSteps
}

/**
 * Act on an approval step.
 * Only the current active step can be acted on.
 * If action is REJECT, the entire approval is rejected.
 * If action is APPROVE and all steps are done, the approval is approved.
 */
export async function actOnStep(input: ActOnStepInput): Promise<ApprovalWithSteps> {
  // Fetch the step with its approval
  const step = await db.approvalStep.findUnique({
    where: { id: input.stepId },
    include: {
      approval: {
        include: {
          steps: {
            include: {
              approver: { select: { id: true, name: true, email: true } },
            },
            orderBy: { id: 'asc' },
          },
        },
      },
    },
  })

  if (!step) {
    throw new Error('Ступень согласования не найдена')
  }

  if (step.approval.status !== 'PENDING') {
    throw new Error(`Согласование уже завершено: ${step.approval.status}`)
  }

  if (step.status !== 'PENDING') {
    throw new Error(`Ступень уже обработана: ${step.status}`)
  }

  // Verify this step is the next one in order
  const pendingSteps = step.approval.steps.filter((s) => s.status === 'PENDING')
  if (pendingSteps.length > 0 && pendingSteps[0].id !== step.id) {
    throw new Error('Необходимо сначала обработать предыдущую ступень')
  }

  // Verify the acting user is the assigned approver
  if (step.approverId !== input.userId) {
    throw new Error('Только назначенный согласующий может обработать эту ступень')
  }

  const newStepStatus = input.action === 'APPROVE' ? 'APPROVED' : 'REJECTED'

  // Update the step
  await db.approvalStep.update({
    where: { id: input.stepId },
    data: {
      status: newStepStatus,
      comment: input.comment || null,
      actedAt: new Date(),
    },
  })

  // Determine approval status
  let approvalStatus: string = 'PENDING'

  if (input.action === 'REJECT') {
    // If any step is rejected, the whole approval is rejected
    approvalStatus = 'REJECTED'
  } else {
    // Check if all steps are approved
    const allSteps = step.approval.steps
    const remainingPending = allSteps.filter(
      (s) => s.status === 'PENDING' && s.id !== input.stepId
    )

    if (remainingPending.length === 0) {
      // All steps approved
      approvalStatus = 'APPROVED'
    }
  }

  // Update approval status
  if (approvalStatus !== 'PENDING') {
    await db.approval.update({
      where: { id: step.approvalId },
      data: { status: approvalStatus, updatedAt: new Date() },
    })
  }

  await logAudit({
    action: input.action === 'APPROVE' ? AuditActions.APPROVE : AuditActions.REJECT,
    entityType: EntityTypes.APPROVAL,
    entityId: step.approvalId,
    organizationId: step.approval.organizationId,
    userId: input.userId,
    newValue: {
      stepId: input.stepId,
      stepStatus: newStepStatus,
      approvalStatus,
      comment: input.comment,
    },
  })

  // Return updated approval
  const updated = await db.approval.findUnique({
    where: { id: step.approvalId },
    include: {
      steps: {
        include: {
          approver: { select: { id: true, name: true, email: true } },
        },
        orderBy: { id: 'asc' },
      },
    },
  })

  return updated as ApprovalWithSteps
}

/**
 * Get all pending approvals where the user is an approver on a pending step.
 */
export async function getPendingApprovalsForUser(
  userId: string,
  organizationId?: string
): Promise<ApprovalWithSteps[]> {
  // Find all pending approval steps assigned to this user
  const steps = await db.approvalStep.findMany({
    where: {
      approverId: userId,
      status: 'PENDING',
      approval: {
        status: 'PENDING',
        ...(organizationId ? { organizationId } : {}),
      },
    },
    include: {
      approval: {
        include: {
          steps: {
            include: {
              approver: { select: { id: true, name: true, email: true } },
            },
            orderBy: { id: 'asc' },
          },
        },
      },
    },
  })

  // Filter out approvals where the user's step is not the next one
  const validApprovals: ApprovalWithSteps[] = []
  const seenApprovalIds = new Set<string>()

  for (const step of steps) {
    if (seenApprovalIds.has(step.approvalId)) continue

    const approvalSteps = step.approval.steps
    const firstPending = approvalSteps.find((s) => s.status === 'PENDING')

    // Only include if this user's step is the next one to act on
    if (firstPending && firstPending.approverId === userId) {
      seenApprovalIds.add(step.approvalId)
      validApprovals.push(step.approval as ApprovalWithSteps)
    }
  }

  return validApprovals
}

/**
 * Get the full status of an approval with all its steps.
 */
export async function getApprovalStatus(approvalId: string): Promise<ApprovalWithSteps | null> {
  const approval = await db.approval.findUnique({
    where: { id: approvalId },
    include: {
      steps: {
        include: {
          approver: { select: { id: true, name: true, email: true } },
        },
        orderBy: { id: 'asc' },
      },
    },
  })

  return approval as ApprovalWithSteps | null
}

/**
 * Cancel an approval (e.g., if the underlying entity is deleted).
 */
export async function cancelApproval(
  approvalId: string,
  userId: string,
  reason?: string
): Promise<ApprovalWithSteps> {
  const approval = await db.approval.findUnique({ where: { id: approvalId } })

  if (!approval) {
    throw new Error('Согласование не найдено')
  }

  if (approval.status !== 'PENDING') {
    throw new Error(`Нельзя отменить согласование в статусе ${approval.status}`)
  }

  await db.approval.update({
    where: { id: approvalId },
    data: { status: 'CANCELLED', updatedAt: new Date() },
  })

  await logAudit({
    action: AuditActions.CANCEL,
    entityType: EntityTypes.APPROVAL,
    entityId: approvalId,
    organizationId: approval.organizationId,
    userId,
    newValue: { reason: reason || null },
  })

  const updated = await db.approval.findUnique({
    where: { id: approvalId },
    include: {
      steps: {
        include: {
          approver: { select: { id: true, name: true, email: true } },
        },
        orderBy: { id: 'asc' },
      },
    },
  })

  return updated as ApprovalWithSteps
}
