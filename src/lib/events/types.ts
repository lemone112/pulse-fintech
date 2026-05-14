// ============================================================================
// PULSE Event Bus — Event Types
// ============================================================================
// Kafka-compatible event types for the event bus.
// Each event has: type, timestamp, organizationId, userId, payload, metadata

// === Base Event ===

export interface BaseEvent {
  type: string
  timestamp: Date
  organizationId: string
  userId?: string
  metadata?: Record<string, unknown>
}

// === Transaction Events ===

export interface TransactionCreatedEvent extends BaseEvent {
  type: 'TransactionCreated'
  payload: {
    transactionId: string
    accountId: string
    counterpartyId?: string
    categoryId?: string
    amount: number
    type: string
    description?: string
  }
}

export interface TransactionUpdatedEvent extends BaseEvent {
  type: 'TransactionUpdated'
  payload: {
    transactionId: string
    changes: Record<string, unknown>
    previousValues: Record<string, unknown>
  }
}

export interface TransactionDeletedEvent extends BaseEvent {
  type: 'TransactionDeleted'
  payload: {
    transactionId: string
    accountId: string
    amount: number
  }
}

// === Invoice Events ===

export interface InvoiceCreatedEvent extends BaseEvent {
  type: 'InvoiceCreated'
  payload: {
    invoiceId: string
    counterpartyId: string
    amount: number
    status: string
  }
}

export interface InvoiceStatusChangedEvent extends BaseEvent {
  type: 'InvoiceStatusChanged'
  payload: {
    invoiceId: string
    previousStatus: string
    newStatus: string
    amount: number
    reason?: string
  }
}

// === Approval Events ===

export interface ApprovalRequestedEvent extends BaseEvent {
  type: 'ApprovalRequested'
  payload: {
    approvalId: string
    entityType: string
    entityId: string
    approverIds: string[]
  }
}

export interface ApprovalStepCompletedEvent extends BaseEvent {
  type: 'ApprovalStepCompleted'
  payload: {
    approvalId: string
    stepId: string
    action: 'APPROVE' | 'REJECT'
    approverId: string
    comment?: string
    approvalStatus: string
  }
}

// === Document Events ===

export interface DocumentSignedEvent extends BaseEvent {
  type: 'DocumentSigned'
  payload: {
    documentId: string
    certificateId: string
    providerName: string
  }
}

// === Rule Events ===

export interface RuleTriggeredEvent extends BaseEvent {
  type: 'RuleTriggered'
  payload: {
    ruleId: string
    ruleName: string
    entityType: string
    entityId: string
    actions: Array<{ type: string; value: unknown }>
  }
}

// === Union of all events ===

export type PulseEvent =
  | TransactionCreatedEvent
  | TransactionUpdatedEvent
  | TransactionDeletedEvent
  | InvoiceCreatedEvent
  | InvoiceStatusChangedEvent
  | ApprovalRequestedEvent
  | ApprovalStepCompletedEvent
  | DocumentSignedEvent
  | RuleTriggeredEvent

// === Event Type Constants ===

export const EventTypes = {
  TRANSACTION_CREATED: 'TransactionCreated',
  TRANSACTION_UPDATED: 'TransactionUpdated',
  TRANSACTION_DELETED: 'TransactionDeleted',
  INVOICE_CREATED: 'InvoiceCreated',
  INVOICE_STATUS_CHANGED: 'InvoiceStatusChanged',
  APPROVAL_REQUESTED: 'ApprovalRequested',
  APPROVAL_STEP_COMPLETED: 'ApprovalStepCompleted',
  DOCUMENT_SIGNED: 'DocumentSigned',
  RULE_TRIGGERED: 'RuleTriggered',
} as const

export type EventType = typeof EventTypes[keyof typeof EventTypes]

// === Handler Types ===

export type EventHandler<T extends PulseEvent = PulseEvent> = (event: T) => void | Promise<void>
