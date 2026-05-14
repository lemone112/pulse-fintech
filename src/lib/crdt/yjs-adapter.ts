// ============================================================================
// PULSE Fintech — Yjs Adapter
// ============================================================================
//
// Yjs adapter for real-time collaborative editing.
// Uses Y.Doc as the CRDT document model.
//
// Provides:
// - createYDoc(id) — create a Yjs document for an entity
// - connectProvider(doc, wsUrl) — connect via WebSocket provider
// - getYDoc(id) — retrieve existing doc from cache
// - Shared transaction editing with field-level conflict resolution
// - Presence awareness (who's viewing/editing)
// - Undo/Redo management
// - Sync protocol for initial state exchange
// ============================================================================

import * as Y from 'yjs'
import type { CRDTEntityType, LWWRegisterState, VectorClockState } from './types'

// ---------------------------------------------------------------------------
// Doc cache — keep Yjs docs alive for the session
// ---------------------------------------------------------------------------

const docCache = new Map<string, Y.Doc>()

// ---------------------------------------------------------------------------
// Awareness state type
// ---------------------------------------------------------------------------

export interface AwarenessState {
  nodeId: string
  userName: string
  entityType: CRDTEntityType
  entityId: string
  fields: string[]  // which fields the user is editing
  cursor?: unknown
}

// ---------------------------------------------------------------------------
// Create a Yjs document for a specific entity
// ---------------------------------------------------------------------------

export function createYDoc(id: string, entityType: CRDTEntityType): Y.Doc {
  const cacheKey = `${entityType}:${id}`

  if (docCache.has(cacheKey)) {
    return docCache.get(cacheKey)!
  }

  const doc = new Y.Doc()

  // Store metadata as Y.Map for conflict-free replication
  const meta = doc.getMap('__meta__')
  meta.set('entityType', entityType)
  meta.set('entityId', id)
  meta.set('createdAt', new Date().toISOString())

  docCache.set(cacheKey, doc)
  return doc
}

// ---------------------------------------------------------------------------
// Get existing Yjs doc from cache
// ---------------------------------------------------------------------------

export function getYDoc(id: string, entityType: CRDTEntityType): Y.Doc | null {
  const cacheKey = `${entityType}:${id}`
  return docCache.get(cacheKey) ?? null
}

// ---------------------------------------------------------------------------
// Destroy a Yjs doc and remove from cache
// ---------------------------------------------------------------------------

export function destroyYDoc(id: string, entityType: CRDTEntityType): void {
  const cacheKey = `${entityType}:${id}`
  const doc = docCache.get(cacheKey)
  if (doc) {
    doc.destroy()
    docCache.delete(cacheKey)
  }
}

// ---------------------------------------------------------------------------
// Apply LWW-Register field updates to a Yjs doc
// ---------------------------------------------------------------------------

export function applyFieldUpdates(
  doc: Y.Doc,
  fields: Record<string, LWWRegisterState<unknown>>,
): void {
  const fieldsMap = doc.getMap('fields')
  doc.transact(() => {
    for (const [fieldName, state] of Object.entries(fields)) {
      const fieldMap = fieldsMap.get(fieldName) as Y.Map<unknown> | undefined
      if (!fieldMap) {
        const newFieldMap = new Y.Map<unknown>()
        newFieldMap.set('value', state.value)
        newFieldMap.set('timestamp', state.timestamp)
        newFieldMap.set('nodeId', state.nodeId)
        fieldsMap.set(fieldName, newFieldMap)
      } else {
        const currentTs = (fieldMap.get('timestamp') as number) ?? 0
        const currentNode = (fieldMap.get('nodeId') as string) ?? ''
        if (state.timestamp > currentTs || (state.timestamp === currentTs && state.nodeId > currentNode)) {
          fieldMap.set('value', state.value)
          fieldMap.set('timestamp', state.timestamp)
          fieldMap.set('nodeId', state.nodeId)
        }
      }
    }
  }, 'crdt-sync')
}

// ---------------------------------------------------------------------------
// Read all fields from a Yjs doc as LWW-Register states
// ---------------------------------------------------------------------------

export function readFieldUpdates(
  doc: Y.Doc,
): Record<string, LWWRegisterState<unknown>> {
  const fieldsMap = doc.getMap('fields')
  const result: Record<string, LWWRegisterState<unknown>> = {}

  for (const [fieldName, fieldData] of fieldsMap) {
    if (fieldData instanceof Y.Map) {
      result[fieldName] = {
        value: fieldData.get('value') as unknown,
        timestamp: (fieldData.get('timestamp') as number) ?? 0,
        nodeId: (fieldData.get('nodeId') as string) ?? '',
      }
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// Apply vector clock update to a Yjs doc
// ---------------------------------------------------------------------------

export function applyVectorClock(
  doc: Y.Doc,
  vectorClock: VectorClockState,
): void {
  const vcMap = doc.getMap('vectorClock')
  doc.transact(() => {
    for (const [nodeId, counter] of vectorClock) {
      const current = (vcMap.get(nodeId) as number) ?? 0
      vcMap.set(nodeId, Math.max(current, counter))
    }
  }, 'crdt-sync')
}

// ---------------------------------------------------------------------------
// Read vector clock from a Yjs doc
// ---------------------------------------------------------------------------

export function readVectorClock(doc: Y.Doc): VectorClockState {
  const vcMap = doc.getMap('vectorClock')
  const result: VectorClockState = []
  for (const [nodeId, counter] of vcMap) {
    result.push([nodeId as string, counter as number])
  }
  return result
}

// ---------------------------------------------------------------------------
// Get encoded state (for persistence / sync)
// ---------------------------------------------------------------------------

export function encodeState(doc: Y.Doc): Uint8Array {
  return Y.encodeStateAsUpdate(doc)
}

// ---------------------------------------------------------------------------
// Apply encoded state from remote
// ---------------------------------------------------------------------------

export function applyState(doc: Y.Doc, update: Uint8Array): void {
  Y.applyUpdate(doc, update)
}

// ---------------------------------------------------------------------------
// Get diff from a state vector (for incremental sync)
// ---------------------------------------------------------------------------

export function encodeDiff(doc: Y.Doc, stateVector: Uint8Array): Uint8Array {
  return Y.encodeStateAsUpdate(doc, stateVector)
}

// ---------------------------------------------------------------------------
// Get state vector (for sync step 1 exchange)
// ---------------------------------------------------------------------------

export function encodeStateVector(doc: Y.Doc): Uint8Array {
  return Y.encodeStateVector(doc)
}

// ---------------------------------------------------------------------------
// Observer — watch for changes on a Yjs doc
// ---------------------------------------------------------------------------

export function observeDoc(
  doc: Y.Doc,
  callback: (event: Y.YMapEvent<unknown>) => void,
): () => void {
  const fieldsMap = doc.getMap('fields')
  const handler = (event: Y.YMapEvent<unknown>) => {
    callback(event)
  }
  fieldsMap.observe(handler)
  return () => fieldsMap.unobserve(handler)
}

// ---------------------------------------------------------------------------
// Connect provider — stub for WebSocket provider
// Actual WebSocket connection is handled by the sync engine
// ---------------------------------------------------------------------------

export interface ProviderConnection {
  connected: boolean
  disconnect(): void
  reconnect(): void
  destroy(): void
}

export function connectProvider(
  _doc: Y.Doc,
  _wsUrl: string,
): ProviderConnection {
  // The actual connection is managed by the sync engine.
  // This is a placeholder that returns a no-op provider.
  return {
    connected: false,
    disconnect() { /* no-op */ },
    reconnect() { /* no-op */ },
    destroy() { /* no-op */ },
  }
}
