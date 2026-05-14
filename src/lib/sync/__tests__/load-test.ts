// ============================================================================
// PULSE Fintech — Load Test Utilities for Sync Engine
// ============================================================================
//
// Simple load test for the sync engine.
// Simulates:
// - Multiple concurrent edits
// - Offline/online cycles
// - Large batch operations
// - Conflict scenarios
//
// NOT a full test suite — just utilities for manual testing.
// Can be run with: npx tsx src/lib/sync/__tests__/load-test.ts
// ============================================================================

import { VectorClock } from '../../crdt/vector-clock'
import { LWWRegister } from '../../crdt/lww-register'
import { ORSet } from '../../crdt/or-set'
import { reconcile, type EntityVersion } from '../reconciler'

// ---------------------------------------------------------------------------
// Test: Vector Clock concurrent detection
// ---------------------------------------------------------------------------

export function testVectorClockConcurrent() {
  console.log('=== Vector Clock Concurrent Test ===')

  const vc1 = new VectorClock([['node-a', 2], ['node-b', 1]])
  const vc2 = new VectorClock([['node-a', 1], ['node-b', 2]])

  console.log('VC1:', vc1.toString())
  console.log('VC2:', vc2.toString())
  console.log('VC1 concurrent VC2:', vc1.concurrent(vc2))
  console.log('VC1 happens-before VC2:', vc1.happensBefore(vc2))

  // These should be concurrent
  if (!vc1.concurrent(vc2)) {
    throw new Error('Expected VC1 and VC2 to be concurrent')
  }
  console.log('✅ Concurrent detection works\n')
}

// ---------------------------------------------------------------------------
// Test: LWW-Register merge
// ---------------------------------------------------------------------------

export function testLWWRegisterMerge() {
  console.log('=== LWW-Register Merge Test ===')

  const reg1 = new LWWRegister(100, 5, 'node-a')
  const reg2 = new LWWRegister(200, 5, 'node-b')

  console.log('Reg1:', reg1.toState())
  console.log('Reg2:', reg2.toState())

  const merged = reg1.merge(reg2)
  console.log('Merged:', merged.toState())

  // Same timestamp, node-b > node-a → node-b wins
  if (merged.value !== 200) {
    throw new Error(`Expected merged value 200, got ${merged.value}`)
  }
  console.log('✅ LWW-Register merge works\n')
}

// ---------------------------------------------------------------------------
// Test: OR-Set concurrent add+remove
// ---------------------------------------------------------------------------

export function testORSetConcurrent() {
  console.log('=== OR-Set Concurrent Add+Remove Test ===')

  const set1 = new ORSet<string>()
  set1.add('tag-1', 'unique-1')
  set1.add('tag-2', 'unique-2')
  set1.remove('tag-1') // Remove tag-1

  const set2 = new ORSet<string>()
  set2.add('tag-1', 'unique-3') // Concurrent add with new tag
  set2.add('tag-3', 'unique-4')

  console.log('Set1 items:', set1.items())
  console.log('Set2 items:', set2.items())

  const merged = set1.merge(set2)
  console.log('Merged items:', merged.items())

  // tag-1 should be present because set2 added it with a new unique tag
  if (!merged.has('tag-1')) {
    throw new Error('Expected tag-1 to be present after merge (concurrent add wins)')
  }
  if (!merged.has('tag-2')) {
    throw new Error('Expected tag-2 to be present after merge')
  }
  if (!merged.has('tag-3')) {
    throw new Error('Expected tag-3 to be present after merge')
  }
  console.log('✅ OR-Set concurrent add+remove works\n')
}

// ---------------------------------------------------------------------------
// Test: Reconciliation with concurrent updates
// ---------------------------------------------------------------------------

export function testReconciliation() {
  console.log('=== Reconciliation Test ===')

  const local: EntityVersion = {
    id: 'tx-1',
    lamportTimestamp: 5,
    vectorClock: [['node-a', 3], ['node-b', 1]],
    tombstone: false,
    entityType: 'transaction',
    fields: {
      amount: { value: 1000, timestamp: 3, nodeId: 'node-a' },
      description: { value: 'Local edit', timestamp: 5, nodeId: 'node-a' },
    },
  }

  const server: EntityVersion = {
    id: 'tx-1',
    lamportTimestamp: 5,
    vectorClock: [['node-a', 1], ['node-b', 3]],
    tombstone: false,
    entityType: 'transaction',
    fields: {
      amount: { value: 2000, timestamp: 4, nodeId: 'node-b' },
      description: { value: 'Server edit', timestamp: 2, nodeId: 'node-b' },
    },
  }

  const result = reconcile(local, server, 'node-a')
  console.log('Action:', result.action)
  console.log('Merged fields:', result.mergedFields)
  console.log('New lamport:', result.newLamportTimestamp)
  console.log('New VC:', result.newVectorClock)

  // Should be 'merge' (concurrent)
  if (result.action !== 'merge') {
    throw new Error(`Expected 'merge', got '${result.action}'`)
  }

  // amount: node-b has timestamp 4, node-a has 3 → node-b wins → 2000
  const mergedAmount = result.mergedFields.amount
  if (mergedAmount.value !== 2000) {
    throw new Error(`Expected merged amount 2000, got ${mergedAmount.value}`)
  }

  // description: node-a has timestamp 5, node-b has 2 → node-a wins → 'Local edit'
  const mergedDesc = result.mergedFields.description
  if (mergedDesc.value !== 'Local edit') {
    throw new Error(`Expected merged description 'Local edit', got ${mergedDesc.value}`)
  }

  console.log('✅ Reconciliation with concurrent updates works\n')
}

// ---------------------------------------------------------------------------
// Test: Simulate offline/online cycle
// ---------------------------------------------------------------------------

export function testOfflineOnlineCycle() {
  console.log('=== Offline/Online Cycle Test ===')

  // Node goes offline, makes 3 edits
  const vc = new VectorClock()
  vc.increment('node-a') // ts=1
  vc.increment('node-a') // ts=2
  vc.increment('node-a') // ts=3

  console.log('After 3 offline edits:', vc.toString())

  // Server state while offline
  const serverVC = new VectorClock([['node-a', 1], ['node-b', 2]])

  console.log('Server VC:', serverVC.toString())

  // Are they concurrent?
  const isConcurrent = vc.concurrent(serverVC)
  console.log('Concurrent:', isConcurrent)

  // Merge vector clocks
  const merged = vc.merge(serverVC)
  console.log('Merged VC:', merged.toString())

  console.log('✅ Offline/online cycle simulation works\n')
}

// ---------------------------------------------------------------------------
// Test: Large batch of concurrent edits
// ---------------------------------------------------------------------------

export function testLargeBatchEdits() {
  console.log('=== Large Batch Edits Test ===')

  const nodeCount = 10
  const editsPerNode = 100
  const start = Date.now()

  // Create vector clocks for each node
  const clocks: VectorClock[] = []
  for (let i = 0; i < nodeCount; i++) {
    const vc = new VectorClock()
    for (let j = 0; j < editsPerNode; j++) {
      vc.increment(`node-${i}`)
    }
    clocks.push(vc)
  }

  // Merge all clocks
  let merged = clocks[0]
  for (let i = 1; i < clocks.length; i++) {
    merged = merged.merge(clocks[i])
  }

  const elapsed = Date.now() - start
  console.log(`Merged ${nodeCount} clocks × ${editsPerNode} edits in ${elapsed}ms`)
  console.log('Final VC:', merged.toString())

  // All node counters should equal editsPerNode
  for (let i = 0; i < nodeCount; i++) {
    const counter = merged.get(`node-${i}`)
    if (counter !== editsPerNode) {
      throw new Error(`Expected node-${i} counter ${editsPerNode}, got ${counter}`)
    }
  }

  console.log('✅ Large batch edits test passed\n')
}

// ---------------------------------------------------------------------------
// Test: Conflict scenario — two nodes edit same field
// ---------------------------------------------------------------------------

export function testFieldConflictResolution() {
  console.log('=== Field Conflict Resolution Test ===')

  // Node A edits the amount field
  const regA = new LWWRegister(5000, 10, 'node-a')

  // Node B edits the same amount field at the same time
  const regB = new LWWRegister(7000, 10, 'node-b')

  // Merge — should deterministically pick one
  const merged = regA.merge(regB)
  console.log('Node A amount:', regA.toState())
  console.log('Node B amount:', regB.toState())
  console.log('Merged amount:', merged.toState())

  // Same timestamp, nodeId breaks tie: 'node-b' > 'node-a' → node-b wins
  if (merged.value !== 7000 || merged.nodeId !== 'node-b') {
    throw new Error('Expected node-b to win the tie-break')
  }
  console.log('✅ Field conflict resolution works (deterministic tie-break)\n')
}

// ---------------------------------------------------------------------------
// Run all tests
// ---------------------------------------------------------------------------

export function runAllLoadTests() {
  console.log('🧪 PULSE CRDT Load Tests\n')
  console.log('========================\n')

  try {
    testVectorClockConcurrent()
    testLWWRegisterMerge()
    testORSetConcurrent()
    testReconciliation()
    testOfflineOnlineCycle()
    testLargeBatchEdits()
    testFieldConflictResolution()

    console.log('========================')
    console.log('✅ All tests passed!')
  } catch (err) {
    console.error('========================')
    console.error('❌ Test failed:', err)
    process.exit(1)
  }
}

// Auto-run if executed directly
runAllLoadTests()
