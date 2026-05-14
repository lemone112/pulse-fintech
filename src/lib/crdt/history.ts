// ============================================================================
// PULSE Fintech — Undo/Redo Manager via CRDT History
// ============================================================================
//
// Tracks operations and allows reversal.
// Based on the Yjs UndoManager concept but adapted for our entity-based CRDT.
//
// How it works:
// - push(operation) — record an operation in the history
// - undo() — reverse the most recent operation
// - redo() — re-apply the most recently undone operation
// - Each operation stores enough info to reverse it:
//   - The entity type & ID
//   - The field-level changes (before & after)
//   - The lamport timestamp and vector clock
//
// Limitations:
// - Undo is scoped to the current session (not persisted across refreshes)
// - Concurrent edits by other users cannot be undone locally
// ============================================================================

import type { CRDTEntityType, LWWRegisterState, VectorClockState } from '../crdt/types'
import { syncEngine } from '../sync/engine'

// ---------------------------------------------------------------------------
// Operation record — stores before & after for undo/redo
// ---------------------------------------------------------------------------

export interface HistoryOperation {
  /** Unique operation ID */
  id: string
  /** Entity type */
  entityType: CRDTEntityType
  /** Entity ID */
  entityId: string
  /** Field-level changes: fieldName → { before, after } */
  fieldChanges: Record<string, { before: LWWRegisterState<unknown>; after: LWWRegisterState<unknown> }>
  /** Lamport timestamp */
  lamportTimestamp: number
  /** Vector clock at the time of the operation */
  vectorClock: VectorClockState
  /** ISO timestamp for display */
  timestamp: string
  /** Description for the UI (e.g., "Изменена сумма") */
  description?: string
}

// ---------------------------------------------------------------------------
// History stack
// ---------------------------------------------------------------------------

const MAX_HISTORY_SIZE = 100

class HistoryManager {
  private undoStack: HistoryOperation[] = []
  private redoStack: HistoryOperation[] = []
  private subscribers = new Set<() => void>()

  // -----------------------------------------------------------------------
  // Push an operation onto the undo stack
  // -----------------------------------------------------------------------

  push(operation: HistoryOperation): void {
    this.undoStack.push(operation)
    this.redoStack = [] // Clear redo stack on new operation

    // Limit stack size
    if (this.undoStack.length > MAX_HISTORY_SIZE) {
      this.undoStack.shift()
    }

    this.notify()
  }

  // -----------------------------------------------------------------------
  // Undo the most recent operation
  // -----------------------------------------------------------------------

  async undo(): Promise<HistoryOperation | null> {
    const operation = this.undoStack.pop()
    if (!operation) return null

    // Reverse the changes
    const reverseChanges: Record<string, unknown> = {}
    for (const [field, change] of Object.entries(operation.fieldChanges)) {
      reverseChanges[field] = change.before.value
    }

    // Apply reversed changes via sync engine
    await syncEngine.applyLocalChange(
      operation.entityType,
      operation.entityId,
      reverseChanges,
      'update',
    )

    // Push to redo stack
    this.redoStack.push(operation)

    this.notify()
    return operation
  }

  // -----------------------------------------------------------------------
  // Redo the most recently undone operation
  // -----------------------------------------------------------------------

  async redo(): Promise<HistoryOperation | null> {
    const operation = this.redoStack.pop()
    if (!operation) return null

    // Re-apply the changes
    const forwardChanges: Record<string, unknown> = {}
    for (const [field, change] of Object.entries(operation.fieldChanges)) {
      forwardChanges[field] = change.after.value
    }

    // Apply forward changes via sync engine
    await syncEngine.applyLocalChange(
      operation.entityType,
      operation.entityId,
      forwardChanges,
      'update',
    )

    // Push back to undo stack
    this.undoStack.push(operation)

    this.notify()
    return operation
  }

  // -----------------------------------------------------------------------
  // Can undo?
  // -----------------------------------------------------------------------

  canUndo(): boolean {
    return this.undoStack.length > 0
  }

  // -----------------------------------------------------------------------
  // Can redo?
  // -----------------------------------------------------------------------

  canRedo(): boolean {
    return this.redoStack.length > 0
  }

  // -----------------------------------------------------------------------
  // Get the undo stack (for UI display)
  // -----------------------------------------------------------------------

  getUndoStack(): readonly HistoryOperation[] {
    return this.undoStack
  }

  // -----------------------------------------------------------------------
  // Get the redo stack
  // -----------------------------------------------------------------------

  getRedoStack(): readonly HistoryOperation[] {
    return this.redoStack
  }

  // -----------------------------------------------------------------------
  // Clear all history
  // -----------------------------------------------------------------------

  clear(): void {
    this.undoStack = []
    this.redoStack = []
    this.notify()
  }

  // -----------------------------------------------------------------------
  // Subscribe to history changes
  // -----------------------------------------------------------------------

  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  // -----------------------------------------------------------------------
  // Notify subscribers
  // -----------------------------------------------------------------------

  private notify(): void {
    for (const cb of this.subscribers) {
      try {
        cb()
      } catch (err) {
        console.error('[HistoryManager] Subscriber error:', err)
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const historyManager = new HistoryManager()
