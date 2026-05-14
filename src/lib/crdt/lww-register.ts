// ============================================================================
// PULSE Fintech — Last-Writer-Wins Register
// ============================================================================
//
// The foundation of our CRDT system. Each field of a document is an LWW-Register.
//
// Merge rule:
//   later timestamp wins. If timestamps are equal, the nodeId is used as a
//   deterministic tie-breaker (lexicographic comparison).
//
// This is NOT "last write wins" at the document level — it operates at the
// *field* level, so concurrent edits to different fields of the same document
// are merged without data loss. Only truly conflicting field writes need a
// tie-break, and that tie-break is deterministic.
// ============================================================================

import type { LWWRegisterState } from './types'

export class LWWRegister<T> {
  value: T
  timestamp: number
  nodeId: string

  constructor(value: T, timestamp: number, nodeId: string) {
    this.value = value
    this.timestamp = timestamp
    this.nodeId = nodeId
  }

  // -----------------------------------------------------------------------
  // Update the register — only if the new timestamp is >= current
  // -----------------------------------------------------------------------

  update(value: T, timestamp: number, nodeId: string): void {
    const cmp = compareTimestamps(timestamp, nodeId, this.timestamp, this.nodeId)
    if (cmp >= 0) {
      this.value = value
      this.timestamp = timestamp
      this.nodeId = nodeId
    }
  }

  // -----------------------------------------------------------------------
  // Merge with another register — returns a NEW register (immutable merge)
  // -----------------------------------------------------------------------

  merge(other: LWWRegister<T>): LWWRegister<T> {
    const cmp = compareTimestamps(other.timestamp, other.nodeId, this.timestamp, this.nodeId)
    if (cmp >= 0) {
      return new LWWRegister(other.value, other.timestamp, other.nodeId)
    }
    return this.clone()
  }

  // -----------------------------------------------------------------------
  // Clone
  // -----------------------------------------------------------------------

  clone(): LWWRegister<T> {
    return new LWWRegister(this.value, this.timestamp, this.nodeId)
  }

  // -----------------------------------------------------------------------
  // Equality check
  // -----------------------------------------------------------------------

  equals(other: LWWRegister<T>): boolean {
    return (
      this.timestamp === other.timestamp &&
      this.nodeId === other.nodeId &&
      this.value === other.value
    )
  }

  // -----------------------------------------------------------------------
  // Serialise to plain object
  // -----------------------------------------------------------------------

  toState(): LWWRegisterState<T> {
    return { value: this.value, timestamp: this.timestamp, nodeId: this.nodeId }
  }

  // -----------------------------------------------------------------------
  // Deserialise from plain object
  // -----------------------------------------------------------------------

  static fromState<T>(state: LWWRegisterState<T>): LWWRegister<T> {
    return new LWWRegister(state.value, state.timestamp, state.nodeId)
  }
}

// ---------------------------------------------------------------------------
// Compare two (timestamp, nodeId) pairs.
// Returns:
//   > 0  if (tsA, nodeA) is newer
//   < 0  if (tsB, nodeB) is newer
//   0    if equal
// ---------------------------------------------------------------------------

export function compareTimestamps(
  tsA: number,
  nodeA: string,
  tsB: number,
  nodeB: string,
): number {
  if (tsA !== tsB) return tsA - tsB
  // Deterministic tie-break: higher nodeId wins (lexicographic)
  if (nodeA > nodeB) return 1   // nodeA is higher → nodeA is newer
  if (nodeA < nodeB) return -1
  return 0
}
