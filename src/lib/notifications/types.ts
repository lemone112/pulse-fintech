// ============================================================================
// PULSE Notification System — Types
// ============================================================================
// Notification channels: in-app, email, push
// For now: in-app notifications stored in DB
// Future: add email (Resend), push (Web Push API)

export type NotificationChannel = 'in_app' | 'email' | 'push'

export type NotificationType =
  | 'invoice_overdue'
  | 'approval_needed'
  | 'approval_completed'
  | 'transaction_categorized'
  | 'rule_triggered'
  | 'document_signed'
  | 'payment_received'
  | 'budget_threshold'
  | 'system'

export interface NotificationPayload {
  [key: string]: unknown
}

export interface CreateNotificationInput {
  userId: string
  type: NotificationType
  title: string
  message: string
  channel?: NotificationChannel
  entityType?: string
  entityId?: string
  payload?: NotificationPayload
}

export interface NotificationItem {
  id: string
  userId: string
  type: NotificationType
  channel: NotificationChannel
  title: string
  message: string
  entityType?: string
  entityId?: string
  payload?: NotificationPayload
  read: boolean
  createdAt: Date
}

// Human-readable labels for notification types
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  invoice_overdue: 'Просроченный счёт',
  approval_needed: 'Требуется согласование',
  approval_completed: 'Согласование завершено',
  transaction_categorized: 'Транзакция категоризирована',
  rule_triggered: 'Сработало правило',
  document_signed: 'Документ подписан',
  payment_received: 'Платёж получен',
  budget_threshold: 'Порог бюджета',
  system: 'Система',
}

// Icons for notification types (Lucide icon names)
export const NOTIFICATION_TYPE_ICONS: Record<NotificationType, string> = {
  invoice_overdue: 'AlertTriangle',
  approval_needed: 'CheckSquare',
  approval_completed: 'CheckCircle',
  transaction_categorized: 'Tag',
  rule_triggered: 'Zap',
  document_signed: 'FileCheck',
  payment_received: 'CreditCard',
  budget_threshold: 'BarChart3',
  system: 'Info',
}

// Colors for notification types
export const NOTIFICATION_TYPE_COLORS: Record<NotificationType, string> = {
  invoice_overdue: 'red',
  approval_needed: 'amber',
  approval_completed: 'green',
  transaction_categorized: 'blue',
  rule_triggered: 'purple',
  document_signed: 'emerald',
  payment_received: 'teal',
  budget_threshold: 'orange',
  system: 'gray',
}
