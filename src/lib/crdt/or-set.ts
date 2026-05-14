// ============================================================================
// PULSE Fintech — Observed-Remove Set (OR-Set)
// ============================================================================
//
// An OR-Set allows concurrent add and remove operations without conflicts.
//
// How it works:
//   - Each `add(item)` attaches a unique tag to the item.
//   - `remove(item)` removes all *currently observed* tags for that item.
//   - `merge` unions the additions and removals.
//   - An item is in the set if it has at least one non-removed tag.
//
// This means:
//   - Concurrent add+remove → add wins (the new tag survives)
//   - Concurrent add+add → both tags survive → item is present
//   - Concurrent remove+remove → all observed tags removed
//
// Used for: transaction tags, collection membership, etc.
// ============================================================================

import type { ORSetState } from './types'

export class ORSet<T> {
  /** item → unique tags that added it */
  additions: Map<T, string[]>
  /** Set of removed unique tags */
  removals: Set<string>

  constructor(additions?: Map<T, string[]>, removals?: Set<string>) {
    this.additions = additions ?? new Map()
    this.removals = removals ?? new Set()
  }

  // -----------------------------------------------------------------------
  // Add an item with a unique tag
  // -----------------------------------------------------------------------

  add(item: T, tag: string): void {
    const existing = this.additions.get(item)
    if (existing) {
      if (!existing.includes(tag)) {
        existing.push(tag)
      }
    } else {
      this.additions.set(item, [tag])
    }
    // If this tag was previously removed, un-remove it
    this.removals.delete(tag)
  }

  // -----------------------------------------------------------------------
  // Remove an item — removes all currently observed tags
  // This is the "observed-remove" semantics: we only remove tags we've seen
  // -----------------------------------------------------------------------

  remove(item: T): void {
    const tags = this.additions.get(item)
    if (tags) {
      for (const tag of tags) {
        this.removals.add(tag)
      }
    }
  }

  // -----------------------------------------------------------------------
  // Check if an item is present (has at least one non-removed tag)
  // -----------------------------------------------------------------------

  has(item: T): boolean {
    const tags = this.additions.get(item)
    if (!tags) return false
    return tags.some((tag) => !this.removals.has(tag))
  }

  // -----------------------------------------------------------------------
  // Get all present items
  // -----------------------------------------------------------------------

  items(): T[] {
    const result: T[] = []
    for (const [item] of this.additions) {
      if (this.has(item)) {
        result.push(item)
      }
    }
    return result
  }

  // -----------------------------------------------------------------------
  // Merge with another OR-Set — returns a NEW set
  // -----------------------------------------------------------------------

  merge(other: ORSet<T>): ORSet<T> {
    const newAdditions = new Map<T, string[]>()

    // Union of additions
    for (const [item, tags] of this.additions) {
      newAdditions.set(item, [...tags])
    }
    for (const [item, tags] of other.additions) {
      const existing = newAdditions.get(item)
      if (existing) {
        // Merge tag arrays, deduplicating
        const tagSet = new Set(existing)
        for (const t of tags) tagSet.add(t)
        newAdditions.set(item, Array.from(tagSet))
      } else {
        newAdditions.set(item, [...tags])
      }
    }

    // Union of removals
    const newRemovals = new Set([...this.removals, ...other.removals])

    return new ORSet(newAdditions, newRemovals)
  }

  // -----------------------------------------------------------------------
  // Clone
  // -----------------------------------------------------------------------

  clone(): ORSet<T> {
    const newAdditions = new Map<T, string[]>()
    for (const [item, tags] of this.additions) {
      newAdditions.set(item, [...tags])
    }
    return new ORSet(newAdditions, new Set(this.removals))
  }

  // -----------------------------------------------------------------------
  // Serialise
  // -----------------------------------------------------------------------

  toState(): ORSetState<T> {
    return {
      additions: Array.from(this.additions.entries()),
      removals: Array.from(this.removals),
    }
  }

  // -----------------------------------------------------------------------
  // Deserialise
  // -----------------------------------------------------------------------

  static fromState<T>(state: ORSetState<T>): ORSet<T> {
    return new ORSet(
      new Map(state.additions),
      new Set(state.removals),
    )
  }
}
