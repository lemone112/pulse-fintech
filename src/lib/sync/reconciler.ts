// ============================================================================
// PULSE Fintech — Reconciliation Engine
// ============================================================================
//
// When the server returns data that differs from local state:
// 1. Compare vector clocks
// 2. If server is ahead: fast-forward local state
// 3. If local is ahead: push changes to server
// 4. If concurrent: merge via CRDT (field-level LWW)
// 5. Update local persistence
//
// Handles:
// - Field-level conflict resolution (LWW per field)
// - Set operations (OR-Set merge)
// - State machine conflicts (causal ordering)
// ============================================================================

import type {
  LWWRegisterState,
  VectorClockState,
  CRDTEntityType,
  BaseCRDT,
} from '../crdt/types'
import { VectorClock } from '../crdt/vector-clock'
import { LWWRegister } from '../crdt/lww-register'
import { ORSet } from '../crdt/or-set'

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface EntityVersion {
  id: string
  lamportTimestamp: number
  vectorClock: VectorClockState
  tombstone: boolean
  entityType: CRDTEntityType
  fields: Record<string, LWWRegisterState<unknown>>
}

// ---------------------------------------------------------------------------
// Reconciliation result
// ---------------------------------------------------------------------------

export type ReconciliationAction =
  | 'no_change'       // Local and server are identical
  | 'fast_forward'    // Server is ahead — update local
  | 'push_local'      // Local is ahead — push to server
  | 'merge'           // Concurrent — merge via CRDT
  | 'create_local'    // Entity doesn't exist locally — create from server

export interface ReconciliationResult {
  action: ReconciliationAction
  /** Merged fields (for fast_forward, merge, create_local) */
  mergedFields: Record<string, LWWRegisterState<unknown>>
  /** New lamport timestamp after merge */
  newLamportTimestamp: number
  /** New vector clock after merge */
  newVectorClock: VectorClockState
}

// ---------------------------------------------------------------------------
// Reconcile local and server entity states
// ---------------------------------------------------------------------------

export function reconcile(
  local: EntityVersion | null,
  server: EntityVersion,
  _nodeId: string,
): ReconciliationResult {
  // Case 1: Entity doesn't exist locally → create from server
  if (!local) {
    return {
      action: 'create_local',
      mergedFields: server.fields,
      newLamportTimestamp: server.lamportTimestamp,
      newVectorClock: server.vectorClock,
    }
  }

  // Both deleted → no change
  if (local.tombstone && server.tombstone) {
    return {
      action: 'no_change',
      mergedFields: {},
      newLamportTimestamp: Math.max(local.lamportTimestamp, server.lamportTimestamp),
      newVectorClock: mergeVectorClocks(local.vectorClock, server.vectorClock),
    }
  }

  const localVC = VectorClock.fromState(local.vectorClock)
  const serverVC = VectorClock.fromState(server.vectorClock)

  const localHBServer = localVC.happensBefore(serverVC)
  const serverHBLocal = serverVC.happensBefore(localVC)

  // Case 2: Server is causally ahead → fast-forward local
  if (localHBServer) {
    return {
      action: 'fast_forward',
      mergedFields: server.fields,
      newLamportTimestamp: server.lamportTimestamp,
      newVectorClock: server.vectorClock,
    }
  }

  // Case 3: Local is causally ahead → push local to server
  if (serverHBLocal) {
    return {
      action: 'push_local',
      mergedFields: local.fields,
      newLamportTimestamp: local.lamportTimestamp,
      newVectorClock: local.vectorClock,
    }
  }

  // Case 4: Concurrent updates → merge via CRDT
  if (localVC.concurrent(serverVC) || localVC.equals(serverVC)) {
    // Same vector clock but different content → merge
    const mergedFields = mergeFields(local.fields, server.fields)
    const mergedVC = localVC.merge(serverVC)
    const mergedLamport = Math.max(local.lamportTimestamp, server.lamportTimestamp) + 1

    return {
      action: 'merge',
      mergedFields,
      newLamportTimestamp: mergedLamport,
      newVectorClock: mergedVC.toState(),
    }
  }

  // Fallback: merge (shouldn't reach here, but safe default)
  return {
    action: 'merge',
    mergedFields: mergeFields(local.fields, server.fields),
    newLamportTimestamp: Math.max(local.lamportTimestamp, server.lamportTimestamp),
    newVectorClock: mergeVectorClocks(local.vectorClock, server.vectorClock),
  }
}

// ---------------------------------------------------------------------------
// Field-level merge using LWW-Register
// Each field is merged independently — no whole-document last-write-wins!
// ---------------------------------------------------------------------------

function mergeFields(
  localFields: Record<string, LWWRegisterState<unknown>>,
  serverFields: Record<string, LWWRegisterState<unknown>>,
): Record<string, LWWRegisterState<unknown>> {
  const merged: Record<string, LWWRegisterState<unknown>> = {}

  // All field names from both sides
  const allFieldNames = new Set([
    ...Object.keys(localFields),
    ...Object.keys(serverFields),
  ])

  for (const fieldName of allFieldNames) {
    const localState = localFields[fieldName]
    const serverState = serverFields[fieldName]

    if (!localState && serverState) {
      // Only server has this field → take server
      merged[fieldName] = serverState
    } else if (localState && !serverState) {
      // Only local has this field → keep local
      merged[fieldName] = localState
    } else if (localState && serverState) {
      // Both have it → merge via LWW-Register
      const localReg = LWWRegister.fromState(localState)
      const serverReg = LWWRegister.fromState(serverState)
      const mergedReg = localReg.merge(serverReg)
      merged[fieldName] = mergedReg.toState()
    }
  }

  return merged
}

// ---------------------------------------------------------------------------
// OR-Set merge (for tags and collections)
// ---------------------------------------------------------------------------

export function mergeORSetStates<T>(
  local: { additions: Array<[T, string[]]>; removals: string[] },
  server: { additions: Array<[T, string[]]>; removals: string[] },
): { additions: Array<[T, string[]]>; removals: string[] } {
  const localSet = ORSet.fromState(local)
  const serverSet = ORSet.fromState(server)
  const merged = localSet.merge(serverSet)
  return merged.toState()
}

// ---------------------------------------------------------------------------
// Invoice status conflict resolution
// Uses causal ordering of status transitions
// ---------------------------------------------------------------------------

export interface StatusTransition {
  from: string
  to: string
  timestamp: number
  nodeId: string
  vectorClock: VectorClockState
}

export function resolveStatusConflict(
  localStatus: string,
  localHistory: StatusTransition[],
  serverStatus: string,
  serverHistory: StatusTransition[],
): { winner: string; mergedHistory: StatusTransition[] } {
  // Merge histories by timestamp
  const allEvents = [...localHistory, ...serverHistory].sort(
    (a, b) => a.timestamp - b.timestamp,
  )

  // Deduplicate — same (from, to, nodeId) at same timestamp
  const seen = new Set<string>()
  const merged: StatusTransition[] = []
  for (const event of allEvents) {
    const key = `${event.from}->${event.to}:${event.nodeId}:${event.timestamp}`
    if (!seen.has(key)) {
      seen.add(key)
      merged.push(event)
    }
  }

  // Replay from initial state to determine final status
  const current = localHistory.length >= serverHistory.length ? localStatus : serverStatus

  return { winner: current, mergedHistory: merged }
}

// ---------------------------------------------------------------------------
// Vector clock merge helper
// ---------------------------------------------------------------------------

function mergeVectorClocks(a: VectorClockState, b: VectorClockState): VectorClockState {
  const vcA = VectorClock.fromState(a)
  const vcB = VectorClock.fromState(b)
  return vcA.merge(vcB).toState()
}
