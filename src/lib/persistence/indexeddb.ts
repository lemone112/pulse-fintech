// ============================================================================
// PULSE Fintech — IndexedDB Persistence Layer
// ============================================================================
//
// Offline-first data storage using IndexedDB.
// Stores:
// - CRDT documents (Yjs encoded state)
// - Pending operations queue
// - Sync metadata (vector clocks, timestamps)
// - Cached API responses
//
// Uses a clean async API on top of the raw IndexedDB interface.
// No external idb dependency — we implement a minimal wrapper.
// ============================================================================

import type { CRDTOperation, VectorClockState, CRDTEntityType } from '../crdt/types'

// ---------------------------------------------------------------------------
// Database schema
// ---------------------------------------------------------------------------

const DB_NAME = 'pulse-crdt'
const DB_VERSION = 1

const STORES = {
  /** CRDT documents — key is "entityType:entityId" */
  documents: 'documents',
  /** Pending operations queue — key is operation.id */
  pendingOps: 'pendingOps',
  /** Sync metadata — key is "meta:{entityType}:{entityId}" */
  syncMeta: 'syncMeta',
  /** Cached API responses — key is the request URL */
  cache: 'cache',
} as const

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StoredDocument {
  /** Composite key: "entityType:entityId" */
  key: string
  entityType: CRDTEntityType
  entityId: string
  /** Yjs encoded state as base64 string */
  encodedState: string
  /** Lamport timestamp */
  lamportTimestamp: number
  /** Vector clock state */
  vectorClock: VectorClockState
  /** Tombstone marker */
  tombstone: boolean
  /** Last modified timestamp */
  updatedAt: string
}

export interface StoredPendingOp {
  operation: CRDTOperation
  /** Number of retry attempts */
  retryCount: number
  /** ISO timestamp when added */
  addedAt: string
  /** ISO timestamp of last retry */
  lastRetryAt: string | null
}

export interface StoredSyncMeta {
  key: string
  entityType: CRDTEntityType
  entityId: string
  /** Last known server version (lamport) */
  serverVersion: number
  /** Last successful sync timestamp */
  lastSyncAt: string | null
  /** Local vector clock as of last sync */
  syncedVectorClock: VectorClockState | null
}

export interface StoredCacheEntry {
  key: string
  /** Serialised response body */
  body: string
  /** ISO timestamp */
  cachedAt: string
  /** TTL in milliseconds */
  ttl: number
}

// ---------------------------------------------------------------------------
// Open / upgrade database
// ---------------------------------------------------------------------------

let dbInstance: IDBDatabase | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance)

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result

      if (!db.objectStoreNames.contains(STORES.documents)) {
        const docStore = db.createObjectStore(STORES.documents, { keyPath: 'key' })
        docStore.createIndex('entityType', 'entityType', { unique: false })
        docStore.createIndex('updatedAt', 'updatedAt', { unique: false })
      }

      if (!db.objectStoreNames.contains(STORES.pendingOps)) {
        const opStore = db.createObjectStore(STORES.pendingOps, { keyPath: 'operation.id' })
        opStore.createIndex('addedAt', 'addedAt', { unique: false })
        opStore.createIndex('entityType', 'operation.entityType', { unique: false })
      }

      if (!db.objectStoreNames.contains(STORES.syncMeta)) {
        db.createObjectStore(STORES.syncMeta, { keyPath: 'key' })
      }

      if (!db.objectStoreNames.contains(STORES.cache)) {
        const cacheStore = db.createObjectStore(STORES.cache, { keyPath: 'key' })
        cacheStore.createIndex('cachedAt', 'cachedAt', { unique: false })
      }
    }

    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, mode)
        const store = tx.objectStore(storeName)
        const request = fn(store)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      }),
  )
}

// ---------------------------------------------------------------------------
// Uint8Array ↔ Base64 helpers
// ---------------------------------------------------------------------------

function uint8ToBase64(data: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i])
  }
  return btoa(binary)
}

function base64ToUint8(base64: string): Uint8Array {
  const binary = atob(base64)
  const data = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    data[i] = binary.charCodeAt(i)
  }
  return data
}

// ---------------------------------------------------------------------------
// Document operations
// ---------------------------------------------------------------------------

async function saveDocument(doc: StoredDocument): Promise<void> {
  await withStore(STORES.documents, 'readwrite', (store) => store.put(doc))
}

async function loadDocument(key: string): Promise<StoredDocument | null> {
  const result = await withStore<StoredDocument | undefined>(
    STORES.documents,
    'readonly',
    (store) => store.get(key),
  )
  return result ?? null
}

async function loadAllDocuments(entityType?: CRDTEntityType): Promise<StoredDocument[]> {
  if (entityType) {
    return withStore<StoredDocument[]>(STORES.documents, 'readonly', (store) => {
      const index = store.index('entityType')
      return index.getAll(entityType)
    })
  }
  return withStore<StoredDocument[]>(STORES.documents, 'readonly', (store) => store.getAll())
}

async function deleteDocument(key: string): Promise<void> {
  await withStore(STORES.documents, 'readwrite', (store) => store.delete(key))
}

// ---------------------------------------------------------------------------
// Pending operations
// ---------------------------------------------------------------------------

async function savePendingOp(op: StoredPendingOp): Promise<void> {
  await withStore(STORES.pendingOps, 'readwrite', (store) => store.put(op))
}

async function getPendingOps(): Promise<StoredPendingOp[]> {
  return withStore<StoredPendingOp[]>(STORES.pendingOps, 'readonly', (store) =>
    store.getAll(),
  )
}

async function removePendingOp(id: string): Promise<void> {
  await withStore(STORES.pendingOps, 'readwrite', (store) => store.delete(id))
}

async function clearPendingOps(): Promise<void> {
  await withStore(STORES.pendingOps, 'readwrite', (store) => store.clear())
}

// ---------------------------------------------------------------------------
// Sync metadata
// ---------------------------------------------------------------------------

async function saveSyncMeta(meta: StoredSyncMeta): Promise<void> {
  await withStore(STORES.syncMeta, 'readwrite', (store) => store.put(meta))
}

async function getSyncMeta(
  entityType: CRDTEntityType,
  entityId: string,
): Promise<StoredSyncMeta | null> {
  const key = `meta:${entityType}:${entityId}`
  const result = await withStore<StoredSyncMeta | undefined>(
    STORES.syncMeta,
    'readonly',
    (store) => store.get(key),
  )
  return result ?? null
}

async function getAllSyncMeta(): Promise<StoredSyncMeta[]> {
  return withStore<StoredSyncMeta[]>(STORES.syncMeta, 'readonly', (store) => store.getAll())
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

async function saveCache(key: string, body: string, ttl = 300_000): Promise<void> {
  const entry: StoredCacheEntry = {
    key,
    body,
    cachedAt: new Date().toISOString(),
    ttl,
  }
  await withStore(STORES.cache, 'readwrite', (store) => store.put(entry))
}

async function getCache(key: string): Promise<string | null> {
  const result = await withStore<StoredCacheEntry | undefined>(
    STORES.cache,
    'readonly',
    (store) => store.get(key),
  )
  if (!result) return null

  const age = Date.now() - new Date(result.cachedAt).getTime()
  if (age > result.ttl) {
    // Expired — delete and return null
    await withStore(STORES.cache, 'readwrite', (store) => store.delete(key))
    return null
  }

  return result.body
}

async function clearCache(): Promise<void> {
  await withStore(STORES.cache, 'readwrite', (store) => store.clear())
}

// ---------------------------------------------------------------------------
// Clear everything
// ---------------------------------------------------------------------------

async function clear(): Promise<void> {
  const db = await openDB()
  const storeNames = Array.from(db.objectStoreNames)
  const tx = db.transaction(storeNames, 'readwrite')
  for (const name of storeNames) {
    tx.objectStore(name).clear()
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const persistence = {
  // Documents
  saveDocument,
  loadDocument,
  loadAllDocuments,
  deleteDocument,

  // Pending operations
  savePendingOp,
  getPendingOps,
  removePendingOp,
  clearPendingOps,

  // Sync metadata
  saveSyncMeta,
  getSyncMeta,
  getAllSyncMeta,

  // Cache
  saveCache,
  getCache,
  clearCache,

  // Utility
  clear,

  // Encoding helpers
  uint8ToBase64,
  base64ToUint8,
}
