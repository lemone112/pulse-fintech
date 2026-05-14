// ============================================================================
// PULSE Fintech — Vector Clock
// ============================================================================
//
// Vector clock for causal ordering across distributed nodes.
//
// Each node maintains a counter. When a node performs an operation, it
// increments its own counter. When merging with another clock, each entry
// takes the max of both counters.
//
// Comparison:
//   A happens-before B  iff  ∀k: A[k] ≤ B[k]  ∧  ∃k: A[k] < B[k]
//   A concurrent B     iff  ¬(A hb B) ∧ ¬(B hb A)
//
// Used for:
//   - Causal ordering of invoice status transitions
//   - Detecting concurrent updates that need CRDT merge
//   - State vector exchange in sync protocol
// ============================================================================

import type { VectorClockState } from './types'

export class VectorClock {
  clock: Map<string, number>

  constructor(entries?: Map<string, number> | Array<[string, number]>) {
    if (entries instanceof Map) {
      this.clock = new Map(entries)
    } else if (Array.isArray(entries)) {
      this.clock = new Map(entries)
    } else {
      this.clock = new Map()
    }
  }

  // -----------------------------------------------------------------------
  // Get the counter for a node
  // -----------------------------------------------------------------------

  get(nodeId: string): number {
    return this.clock.get(nodeId) ?? 0
  }

  // -----------------------------------------------------------------------
  // Increment a node's counter and return the new value
  // -----------------------------------------------------------------------

  increment(nodeId: string): number {
    const current = this.get(nodeId)
    const next = current + 1
    this.clock.set(nodeId, next)
    return next
  }

  // -----------------------------------------------------------------------
  // Merge — pointwise max, returns a NEW VectorClock
  // -----------------------------------------------------------------------

  merge(other: VectorClock): VectorClock {
    const result = new Map(this.clock)
    for (const [nodeId, counter] of other.clock) {
      result.set(nodeId, Math.max(this.get(nodeId), counter))
    }
    return new VectorClock(result)
  }

  // -----------------------------------------------------------------------
  // happens-before relation
  // Returns true if this clock happened before the other clock
  // A hb B  iff  ∀k: A[k] ≤ B[k]  ∧  ∃k: A[k] < B[k]
  // -----------------------------------------------------------------------

  happensBefore(other: VectorClock): boolean {
    const allKeys = new Set([...this.clock.keys(), ...other.clock.keys()])
    let foundStrictlyLess = false

    for (const key of allKeys) {
      const a = this.get(key)
      const b = other.get(key)
      if (a > b) return false       // this has a higher counter → cannot hb
      if (a < b) foundStrictlyLess = true
    }

    return foundStrictlyLess
  }

  // -----------------------------------------------------------------------
  // Concurrent check — neither happens-before the other
  // -----------------------------------------------------------------------

  concurrent(other: VectorClock): boolean {
    return !this.happensBefore(other) && !other.happensBefore(this)
  }

  // -----------------------------------------------------------------------
  // Equal check — same counters for all nodes
  // -----------------------------------------------------------------------

  equals(other: VectorClock): boolean {
    const allKeys = new Set([...this.clock.keys(), ...other.clock.keys()])
    for (const key of allKeys) {
      if (this.get(key) !== other.get(key)) return false
    }
    return true
  }

  // -----------------------------------------------------------------------
  // Clone
  // -----------------------------------------------------------------------

  clone(): VectorClock {
    return new VectorClock(new Map(this.clock))
  }

  // -----------------------------------------------------------------------
  // Serialise
  // -----------------------------------------------------------------------

  toState(): VectorClockState {
    return Array.from(this.clock.entries())
  }

  // -----------------------------------------------------------------------
  // Deserialise
  // -----------------------------------------------------------------------

  static fromState(state: VectorClockState): VectorClock {
    return new VectorClock(state)
  }

  // -----------------------------------------------------------------------
  // Pretty-print for debugging
  // -----------------------------------------------------------------------

  toString(): string {
    const entries = Array.from(this.clock.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(', ')
    return `{${entries}}`
  }
}
