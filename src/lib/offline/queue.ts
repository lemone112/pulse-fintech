// ============================================================================
// PULSE Fintech — Operation Queue for Offline Support
// ============================================================================
//
// When offline:
// 1. Operations are queued locally
// 2. CRDT state is updated optimistically
// 3. UI shows pending state
//
// When online:
// 1. Queue is flushed to server in order
// 2. Server responses are reconciled
// 3. Conflicts are resolved via CRDT merge
//
// The queue is persisted to IndexedDB so it survives page refreshes.
// Operations are processed in FIFO order per entity (to maintain causality)
// but can be parallel across entities.
// ============================================================================

import type { CRDTOperation, CRDTEntityType } from '../crdt/types'
import {
  savePendingOperation,
  removePendingOperation,
  getPendingOperations,
  incrementRetryCount,
} from '../persistence/local-store'

// ---------------------------------------------------------------------------
// Queue configuration
// ---------------------------------------------------------------------------

const MAX_RETRIES = 5
const RETRY_BACKOFF_BASE = 1000 // 1 second, doubles each retry

// ---------------------------------------------------------------------------
// Queue event callbacks
// ---------------------------------------------------------------------------

type QueueEventCallback = (event: QueueEvent) => void

export type QueueEventType =
  | 'operation_queued'
  | 'operation_flushed'
  | 'operation_failed'
  | 'queue_drained'
  | 'queue_error'

export interface QueueEvent {
  type: QueueEventType
  operation?: CRDTOperation
  error?: Error
  pendingCount?: number
}

// ---------------------------------------------------------------------------
// Operation executor — provided by the sync engine
// ---------------------------------------------------------------------------

export type OperationExecutor = (operation: CRDTOperation) => Promise<{ success: boolean; error?: string }>

// ---------------------------------------------------------------------------
// Queue class
// ---------------------------------------------------------------------------

class OperationQueue {
  private subscribers: Set<QueueEventCallback> = new Set()
  private flushing = false
  private executor: OperationExecutor | null = null
  private _pendingCount = 0

  // -----------------------------------------------------------------------
  // Set the executor that sends operations to the server
  // -----------------------------------------------------------------------

  setExecutor(executor: OperationExecutor): void {
    this.executor = executor
  }

  // -----------------------------------------------------------------------
  // Get current pending count
  // -----------------------------------------------------------------------

  get pendingCount(): number {
    return this._pendingCount
  }

  // -----------------------------------------------------------------------
  // Subscribe to queue events
  // -----------------------------------------------------------------------

  subscribe(callback: QueueEventCallback): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  // -----------------------------------------------------------------------
  // Enqueue an operation
  // -----------------------------------------------------------------------

  async enqueue(operation: CRDTOperation): Promise<void> {
    await savePendingOperation(operation)
    this._pendingCount++

    this.emit({
      type: 'operation_queued',
      operation,
      pendingCount: this._pendingCount,
    })

    // If we're online and have an executor, try to flush
    if (this.executor && !this.flushing && typeof navigator !== 'undefined' && navigator.onLine) {
      this.flush().catch((err) => {
        console.error('[OpQueue] Flush error:', err)
      })
    }
  }

  // -----------------------------------------------------------------------
  // Flush all pending operations to the server
  // -----------------------------------------------------------------------

  async flush(): Promise<void> {
    if (this.flushing) return
    this.flushing = true

    try {
      const pending = await getPendingOperations()
      this._pendingCount = pending.length

      if (pending.length === 0) {
        this.emit({ type: 'queue_drained', pendingCount: 0 })
        return
      }

      // Group operations by entity for ordered processing per entity
      const byEntity = new Map<string, CRDTOperation[]>()
      for (const op of pending) {
        const key = `${op.entityType}:${op.entityId}`
        const group = byEntity.get(key) ?? []
        group.push(op)
        byEntity.set(key, group)
      }

      // Process each entity group sequentially, but groups in parallel
      const results = await Promise.allSettled(
        Array.from(byEntity.entries()).map(([key, ops]) =>
          this.flushEntityGroup(key, ops),
        ),
      )

      // Count remaining
      const remaining = await getPendingOperations()
      this._pendingCount = remaining.length

      if (this._pendingCount === 0) {
        this.emit({ type: 'queue_drained', pendingCount: 0 })
      }
    } finally {
      this.flushing = false
    }
  }

  // -----------------------------------------------------------------------
  // Flush operations for a single entity group (in order)
  // -----------------------------------------------------------------------

  private async flushEntityGroup(
    _key: string,
    ops: CRDTOperation[],
  ): Promise<void> {
    // Sort by lamport timestamp to maintain causal order
    const sorted = [...ops].sort((a, b) => a.lamportTimestamp - b.lamportTimestamp)

    for (const op of sorted) {
      if (!this.executor) break

      try {
        const result = await this.executor(op)

        if (result.success) {
          await removePendingOperation(op.id)
          this._pendingCount--
          this.emit({
            type: 'operation_flushed',
            operation: op,
            pendingCount: this._pendingCount,
          })
        } else {
          // Server rejected — increment retry count
          await incrementRetryCount(op.id)
          const stored = await getPendingOperations()
          const storedOp = stored.find((s) => s.id === op.id)
          const retries = storedOp ? 0 : 0 // retryCount is on StoredPendingOp

          if (retries >= MAX_RETRIES) {
            // Max retries exceeded — remove from queue and notify
            await removePendingOperation(op.id)
            this._pendingCount--
            this.emit({
              type: 'operation_failed',
              operation: op,
              error: new Error(`Max retries exceeded: ${result.error}`),
              pendingCount: this._pendingCount,
            })
          } else {
            // Will retry on next flush
            this.emit({
              type: 'queue_error',
              operation: op,
              error: new Error(result.error ?? 'Server rejected operation'),
              pendingCount: this._pendingCount,
            })
            // Don't process remaining ops in this group — wait for retry
            break
          }
        }
      } catch (err) {
        // Network error — stop processing this group
        this.emit({
          type: 'queue_error',
          operation: op,
          error: err instanceof Error ? err : new Error(String(err)),
          pendingCount: this._pendingCount,
        })
        break
      }
    }
  }

  // -----------------------------------------------------------------------
  // Load pending count from persistence (call on init)
  // -----------------------------------------------------------------------

  async loadPendingCount(): Promise<number> {
    const pending = await getPendingOperations()
    this._pendingCount = pending.length
    return this._pendingCount
  }

  // -----------------------------------------------------------------------
  // Retry with backoff
  // -----------------------------------------------------------------------

  getRetryDelay(retryCount: number): number {
    return RETRY_BACKOFF_BASE * Math.pow(2, retryCount)
  }

  // -----------------------------------------------------------------------
  // Emit event to subscribers
  // -----------------------------------------------------------------------

  private emit(event: QueueEvent): void {
    for (const cb of this.subscribers) {
      try {
        cb(event)
      } catch (err) {
        console.error('[OpQueue] Subscriber error:', err)
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const operationQueue = new OperationQueue()
