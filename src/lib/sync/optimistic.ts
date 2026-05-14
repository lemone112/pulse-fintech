// ============================================================================
// PULSE Fintech — Optimistic Update Manager
// ============================================================================
//
// Applies changes locally immediately, rolls back if server rejects.
//
// How it works:
// 1. apply(entityType, entityId, changes) — stores the optimistic update
//    and returns the projected new state
// 2. commit(entityType, entityId) — server accepted, remove from pending
// 3. rollback(entityType, entityId) — server rejected, revert to original
//
// UI components can check isPending() to show loading indicators.
// ============================================================================

import type { CRDTEntityType } from '../crdt/types'

// ---------------------------------------------------------------------------
// Optimistic update record
// ---------------------------------------------------------------------------

interface OptimisticUpdate {
  entityType: CRDTEntityType
  entityId: string
  /** The changes applied optimistically */
  changes: Record<string, unknown>
  /** Snapshot of the state before the optimistic update (for rollback) */
  previousState: Record<string, unknown> | null
  /** ISO timestamp when the update was applied */
  appliedAt: string
}

// ---------------------------------------------------------------------------
// Event types
// ---------------------------------------------------------------------------

type OptimisticCallback = (event: OptimisticEvent) => void

export type OptimisticEventType = 'apply' | 'commit' | 'rollback'

export interface OptimisticEvent {
  type: OptimisticEventType
  entityType: CRDTEntityType
  entityId: string
  changes?: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Optimistic Manager
// ---------------------------------------------------------------------------

class OptimisticManager {
  /** Pending optimistic updates keyed by "entityType:entityId" */
  private pending = new Map<string, OptimisticUpdate>()
  /** Subscribers for optimistic update events */
  private subscribers = new Set<OptimisticCallback>()

  // -----------------------------------------------------------------------
  // Apply an optimistic update
  // -----------------------------------------------------------------------

  apply<T extends Record<string, unknown>>(
    entityType: CRDTEntityType,
    entityId: string,
    changes: Record<string, unknown>,
    previousState?: Record<string, unknown> | null,
  ): T {
    const key = `${entityType}:${entityId}`

    const update: OptimisticUpdate = {
      entityType,
      entityId,
      changes,
      previousState: previousState ?? null,
      appliedAt: new Date().toISOString(),
    }

    // If there's already a pending update, chain the previous state
    const existing = this.pending.get(key)
    if (existing) {
      // Keep the original previousState so we can rollback to the very start
      update.previousState = existing.previousState
    }

    this.pending.set(key, update)

    this.emit({ type: 'apply', entityType, entityId, changes })

    // Return the projected new state
    return { ...(previousState ?? {}), ...changes } as T
  }

  // -----------------------------------------------------------------------
  // Commit — server accepted the change
  // -----------------------------------------------------------------------

  commit(entityType: CRDTEntityType, entityId: string): void {
    const key = `${entityType}:${entityId}`
    this.pending.delete(key)
    this.emit({ type: 'commit', entityType, entityId })
  }

  // -----------------------------------------------------------------------
  // Rollback — server rejected the change
  // -----------------------------------------------------------------------

  rollback(entityType: CRDTEntityType, entityId: string): Record<string, unknown> | null {
    const key = `${entityType}:${entityId}`
    const update = this.pending.get(key)

    if (!update) return null

    this.pending.delete(key)
    this.emit({ type: 'rollback', entityType, entityId, changes: update.changes })

    // Return the previous state so callers can revert
    return update.previousState
  }

  // -----------------------------------------------------------------------
  // Check if an entity has a pending optimistic update
  // -----------------------------------------------------------------------

  isPending(entityType: CRDTEntityType, entityId: string): boolean {
    return this.pending.has(`${entityType}:${entityId}`)
  }

  // -----------------------------------------------------------------------
  // Get all pending updates for an entity type
  // -----------------------------------------------------------------------

  getPendingForType(entityType: CRDTEntityType): OptimisticUpdate[] {
    const result: OptimisticUpdate[] = []
    for (const update of this.pending.values()) {
      if (update.entityType === entityType) {
        result.push(update)
      }
    }
    return result
  }

  // -----------------------------------------------------------------------
  // Get the optimistic changes for a specific entity
  // -----------------------------------------------------------------------

  getOptimisticChanges(
    entityType: CRDTEntityType,
    entityId: string,
  ): Record<string, unknown> | null {
    const key = `${entityType}:${entityId}`
    const update = this.pending.get(key)
    return update?.changes ?? null
  }

  // -----------------------------------------------------------------------
  // Count of pending optimistic updates
  // -----------------------------------------------------------------------

  get pendingCount(): number {
    return this.pending.size
  }

  // -----------------------------------------------------------------------
  // Subscribe to optimistic update events
  // -----------------------------------------------------------------------

  subscribe(callback: OptimisticCallback): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  // -----------------------------------------------------------------------
  // Clear all pending optimistic updates
  // -----------------------------------------------------------------------

  clear(): void {
    this.pending.clear()
  }

  // -----------------------------------------------------------------------
  // Emit event
  // -----------------------------------------------------------------------

  private emit(event: OptimisticEvent): void {
    for (const cb of this.subscribers) {
      try {
        cb(event)
      } catch (err) {
        console.error('[OptimisticManager] Subscriber error:', err)
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const optimisticManager = new OptimisticManager()
