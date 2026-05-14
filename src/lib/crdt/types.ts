// ============================================================================
// PULSE Fintech — CRDT Data Structures
// ============================================================================
//
// CRDT data structures for fintech entities:
// 1. TransactionCRDT — LWW-Register for each field + OR-Set for tags
// 2. InvoiceCRDT — LWW-Register + state machine with causal ordering
// 3. CategoryCRDT — LWW-Register with ordering vector
//
// Each CRDT has:
// - id: unique identifier
// - lamportTimestamp: for ordering
// - vectorClock: Map<nodeId, counter> for causal ordering
// - tombstone: boolean for deletion
// - fields: Map<fieldName, LWWRegister> for field-level conflict resolution
//
// LWWRegister<Value>:
// - value: Value
// - timestamp: number (lamport)
// - nodeId: string (who wrote it)
// - merge(other): LWWRegister — later timestamp wins, nodeId breaks ties
// ============================================================================

import type { LWWRegister } from './lww-register'
import type { ORSet } from './or-set'
import type { VectorClock } from './vector-clock'

// ---------------------------------------------------------------------------
// Entity types supported by the CRDT system
// ---------------------------------------------------------------------------

export type CRDTEntityType = 'transaction' | 'invoice' | 'category' | 'counterparty' | 'project' | 'document' | 'rule' | 'budget_item'

// ---------------------------------------------------------------------------
// LWW-Register state — serialisable snapshot of a single-field register
// ---------------------------------------------------------------------------

export interface LWWRegisterState<T> {
  value: T
  timestamp: number
  nodeId: string
}

// ---------------------------------------------------------------------------
// OR-Set state — serialisable snapshot of an observed-remove set
// ---------------------------------------------------------------------------

export interface ORSetState<T> {
  /** item → array of unique tags that added it */
  additions: Array<[T, string[]]>
  /** set of removed unique tags */
  removals: string[]
}

// ---------------------------------------------------------------------------
// Vector clock state — serialisable snapshot
// ---------------------------------------------------------------------------

export type VectorClockState = Array<[string, number]>

// ---------------------------------------------------------------------------
// Base CRDT — common structure shared by all entity CRDTs
// ---------------------------------------------------------------------------

export interface BaseCRDT {
  /** Unique entity identifier (maps to DB primary key) */
  id: string
  /** Lamport timestamp — monotonically increasing counter for total ordering */
  lamportTimestamp: number
  /** Vector clock — causal ordering across nodes */
  vectorClock: VectorClockState
  /** Soft-delete marker */
  tombstone: boolean
  /** Type discriminator */
  entityType: CRDTEntityType
}

// ---------------------------------------------------------------------------
// Transaction CRDT
// ---------------------------------------------------------------------------

export interface TransactionCRDTFields {
  accountId: LWWRegisterState<string>
  counterpartyId: LWWRegisterState<string | null>
  categoryId: LWWRegisterState<string | null>
  projectId: LWWRegisterState<string | null>
  invoiceId: LWWRegisterState<string | null>
  type: LWWRegisterState<string>
  amount: LWWRegisterState<number>
  description: LWWRegisterState<string | null>
  reference: LWWRegisterState<string | null>
  status: LWWRegisterState<string>
  transactionDate: LWWRegisterState<string> // ISO-8601
}

export interface TransactionCRDT extends BaseCRDT {
  entityType: 'transaction'
  fields: TransactionCRDTFields
  /** Tags implemented as OR-Set — concurrent add/remove without conflicts */
  tags: ORSetState<string>
}

// ---------------------------------------------------------------------------
// Invoice CRDT — includes state-machine with causal ordering
// ---------------------------------------------------------------------------

export interface InvoiceCRDTFields {
  counterpartyId: LWWRegisterState<string>
  number: LWWRegisterState<string>
  status: LWWRegisterState<string>
  type: LWWRegisterState<string>
  amount: LWWRegisterState<number>
  taxAmount: LWWRegisterState<number | null>
  dueDate: LWWRegisterState<string | null>
  issuedDate: LWWRegisterState<string | null>
  description: LWWRegisterState<string | null>
}

/** Causal history entry for invoice status transitions */
export interface InvoiceStatusEvent {
  from: string
  to: string
  timestamp: number
  nodeId: string
  /** Vector clock at the moment of transition */
  vectorClock: VectorClockState
}

export interface InvoiceCRDT extends BaseCRDT {
  entityType: 'invoice'
  fields: InvoiceCRDTFields
  /** Ordered causal history of status transitions — resolves concurrent state-machine conflicts */
  statusHistory: InvoiceStatusEvent[]
}

// ---------------------------------------------------------------------------
// Category CRDT — includes ordering vector for sort position
// ---------------------------------------------------------------------------

export interface CategoryCRDTFields {
  name: LWWRegisterState<string>
  type: LWWRegisterState<string>
  icon: LWWRegisterState<string | null>
  color: LWWRegisterState<string | null>
  parentId: LWWRegisterState<string | null>
  sortOrder: LWWRegisterState<number>
}

export interface CategoryCRDT extends BaseCRDT {
  entityType: 'category'
  fields: CategoryCRDTFields
}

// ---------------------------------------------------------------------------
// Generic CRDT — union of all entity types
// ---------------------------------------------------------------------------

export type EntityCRDT = TransactionCRDT | InvoiceCRDT | CategoryCRDT

// ---------------------------------------------------------------------------
// Operation types — mutations that flow through the sync engine
// ---------------------------------------------------------------------------

export type OperationType = 'create' | 'update' | 'delete' | 'status_transition'

export interface CRDTOperation {
  /** Unique operation ID — used for idempotency and dedup */
  id: string
  /** Which entity type is being mutated */
  entityType: CRDTEntityType
  /** Which entity is being mutated */
  entityId: string
  /** Kind of mutation */
  operationType: OperationType
  /** Field-level changes (key → new LWWRegisterState) */
  changes: Record<string, LWWRegisterState<unknown>>
  /** Lamport timestamp assigned by the originating node */
  lamportTimestamp: number
  /** Vector clock of the originating node at the time of the operation */
  vectorClock: VectorClockState
  /** Node that created this operation */
  nodeId: string
  /** ISO-8601 timestamp for display/debugging */
  createdAt: string
  /** For status_transition operations — the transition details */
  statusTransition?: { from: string; to: string }
}

// ---------------------------------------------------------------------------
// Sync protocol messages
// ---------------------------------------------------------------------------

export type SyncMessageType =
  | 'sync_step_1'   // Send state vector
  | 'sync_step_2'   // Send missing updates based on received state vector
  | 'sync_update'   // Apply update
  | 'awareness'     // Presence information
  | 'ack'           // Acknowledgement

export interface SyncMessage {
  type: SyncMessageType
  senderNodeId: string
  payload: unknown
}

// ---------------------------------------------------------------------------
// Sync status — exposed to the UI
// ---------------------------------------------------------------------------

export type SyncPhase = 'idle' | 'syncing' | 'offline' | 'conflict'

export interface SyncStatus {
  phase: SyncPhase
  online: boolean
  lastSync: string | null
  pendingCount: number
  conflictsCount: number
}

// ---------------------------------------------------------------------------
// Helpers — create default/empty states
// ---------------------------------------------------------------------------

export function makeLWWState<T>(value: T, nodeId: string, timestamp = 0): LWWRegisterState<T> {
  return { value, timestamp, nodeId }
}

export function makeORSetState<T>(): ORSetState<T> {
  return { additions: [], removals: [] }
}

export function makeVectorClockState(): VectorClockState {
  return []
}

export function makeBaseCRDT(
  id: string,
  entityType: CRDTEntityType,
  nodeId: string,
): BaseCRDT {
  return {
    id,
    lamportTimestamp: 0,
    vectorClock: [[nodeId, 0]],
    tombstone: false,
    entityType,
  }
}
