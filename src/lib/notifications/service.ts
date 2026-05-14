// ============================================================================
// PULSE Notification System — Service
// ============================================================================
// Creates and manages in-app notifications.
// Future: add email (Resend), push (Web Push API)

import { db } from '@/lib/db'
import { eventBus } from '@/lib/events/bus'
import { EventTypes } from '@/lib/events/types'
import type {
  CreateNotificationInput,
  NotificationItem,
  NotificationType,
} from './types'

/**
 * Create a new notification.
 */
export async function createNotification(input: CreateNotificationInput): Promise<NotificationItem> {
  const notification = await db.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      channel: input.channel || 'in_app',
      title: input.title,
      message: input.message,
      entityType: input.entityType || null,
      entityId: input.entityId || null,
      payload: input.payload ? JSON.stringify(input.payload) : null,
      read: false,
    },
  })

  // Emit event for real-time updates
  eventBus.emit({
    type: 'NotificationCreated' as never,
    timestamp: new Date(),
    organizationId: '',
    userId: input.userId,
    payload: {
      notificationId: notification.id,
      type: input.type,
      title: input.title,
    },
  })

  return notification as unknown as NotificationItem
}

/**
 * Create notifications for multiple users.
 */
export async function createNotificationsForUsers(
  userIds: string[],
  input: Omit<CreateNotificationInput, 'userId'>
): Promise<void> {
  await Promise.all(
    userIds.map((userId) =>
      createNotification({ ...input, userId })
    )
  )
}

/**
 * Get notifications for a user.
 */
export async function getNotificationsForUser(
  userId: string,
  options?: { unreadOnly?: boolean; limit?: number; offset?: number }
): Promise<{ notifications: NotificationItem[]; total: number; unreadCount: number }> {
  const where = {
    userId,
    ...(options?.unreadOnly ? { read: false } : {}),
  }

  const [notifications, total, unreadCount] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    }),
    db.notification.count({ where }),
    db.notification.count({ where: { userId, read: false } }),
  ])

  return {
    notifications: notifications as unknown as NotificationItem[],
    total,
    unreadCount,
  }
}

/**
 * Mark a notification as read.
 */
export async function markNotificationRead(notificationId: string): Promise<void> {
  await db.notification.update({
    where: { id: notificationId },
    data: { read: true },
  })
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllNotificationsRead(userId: string): Promise<void> {
  await db.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  })
}

/**
 * Delete a notification.
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  await db.notification.delete({ where: { id: notificationId } })
}

// === Helper functions for common notification scenarios ===

/**
 * Notify about an overdue invoice.
 */
export async function notifyInvoiceOverdue(
  userId: string,
  invoiceId: string,
  invoiceNumber: string,
  amount: number,
  dueDate: Date
): Promise<void> {
  await createNotification({
    userId,
    type: 'invoice_overdue',
    title: 'Просроченный счёт',
    message: `Счёт №${invoiceNumber} на сумму ${amount.toLocaleString('ru-RU')} ₽ просрочен (срок: ${dueDate.toLocaleDateString('ru-RU')})`,
    entityType: 'Invoice',
    entityId: invoiceId,
    payload: { invoiceId, invoiceNumber, amount, dueDate: dueDate.toISOString() },
  })
}

/**
 * Notify about a pending approval.
 */
export async function notifyApprovalNeeded(
  approverId: string,
  approvalId: string,
  entityType: string,
  entityId: string,
  description: string
): Promise<void> {
  await createNotification({
    userId: approverId,
    type: 'approval_needed',
    title: 'Требуется согласование',
    message: description,
    entityType,
    entityId,
    payload: { approvalId, entityType, entityId },
  })
}

/**
 * Notify about approval completion.
 */
export async function notifyApprovalCompleted(
  userId: string,
  approvalId: string,
  status: 'APPROVED' | 'REJECTED',
  entityType: string,
  entityId: string
): Promise<void> {
  await createNotification({
    userId,
    type: 'approval_completed',
    title: status === 'APPROVED' ? 'Согласование одобрено' : 'Согласование отклонено',
    message: `Запрос на согласование ${status === 'APPROVED' ? 'одобрен' : 'отклонён'}`,
    entityType,
    entityId,
    payload: { approvalId, status },
  })
}

/**
 * Notify about a triggered rule.
 */
export async function notifyRuleTriggered(
  userId: string,
  ruleId: string,
  ruleName: string,
  entityType: string,
  entityId: string,
  actions: string[]
): Promise<void> {
  await createNotification({
    userId,
    type: 'rule_triggered',
    title: 'Сработало правило',
    message: `Правило «${ruleName}» применено. Действия: ${actions.join(', ')}`,
    entityType,
    entityId,
    payload: { ruleId, ruleName, actions },
  })
}

/**
 * Notify about a signed document.
 */
export async function notifyDocumentSigned(
  userId: string,
  documentId: string,
  documentTitle: string,
  providerName: string
): Promise<void> {
  await createNotification({
    userId,
    type: 'document_signed',
    title: 'Документ подписан',
    message: `Документ «${documentTitle}» подписан через ${providerName}`,
    entityType: 'Document',
    entityId: documentId,
    payload: { documentId, providerName },
  })
}
