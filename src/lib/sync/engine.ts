// ============================================================================
// PULSE Fintech — Sync Engine
// ============================================================================
//
// The heart of the local-first architecture.
// NOT last-write-wins — uses CRDT merge for conflict resolution.
//
// Key behaviors:
// 1. On connect: exchange state vectors, sync incremental updates
// 2. On local change: apply to CRDT, queue for sync
// 3. On remote change: merge into CRDT, notify UI
// 4. On conflict: CRDT merge resolves automatically
// 5. On disconnect: queue operations, continue offline
//
// The engine uses:
// - Yjs documents for CRDT state
// - Vector clocks for causal ordering
// - LWW-Register for field-level conflict resolution
// - OR-Set for set operations (tags)
// - Operation queue for offline persistence
// - Network detector for connectivity awareness
// ============================================================================

import type {
  CRDTEntityType,
  CRDTOperation,
  LWWRegisterState,
  SyncPhase,
  SyncStatus,
  VectorClockState,
} from '../crdt/types'
import { makeLWWState } from '../crdt/types'
import { VectorClock } from '../crdt/vector-clock'
import { LWWRegister } from '../crdt/lww-register'
import { ORSet } from '../crdt/or-set'
import {
  createYDoc,
  getYDoc,
  applyFieldUpdates,
  encodeState,
  applyState,
  encodeDiff,
  encodeStateVector,
  readFieldUpdates,
  readVectorClock,
} from '../crdt/yjs-adapter'
import { SyncSession, serialiseSyncMessage, parseSyncMessage } from '../crdt/sync-protocol'
import { operationQueue, type OperationExecutor } from '../offline/queue'
import { networkDetector } from '../offline/network-detector'
import {
  getNodeId,
  saveTransaction,
  saveInvoice,
  saveCategory,
  setLastSyncVersion,
  getLastSyncVersion,
  getPendingOperations,
  getTransaction,
  getInvoice,
  getCategory,
} from '../persistence/local-store'
import type { BaseCRDT } from '../crdt/types'
import { reconcile, type ReconciliationResult } from './reconciler'
import { optimisticManager } from './optimistic'

// ---------------------------------------------------------------------------
// Engine options
// ---------------------------------------------------------------------------

export interface SyncEngineOptions {
  /** Server base URL for API calls */
  serverUrl?: string
  /** WebSocket URL for real-time sync */
  wsUrl?: string
  /** How often to poll for changes when WebSocket is not available */
  pollIntervalMs?: number
  /** Callback when sync status changes */
  onStatusChange?: (status: SyncStatus) => void
}

// ---------------------------------------------------------------------------
// Engine state
// ---------------------------------------------------------------------------

type StatusCallback = (status: SyncStatus) => void

class SyncEngine {
  private running = false
  private nodeId: string = 'unknown'
  private lamportCounter = 0
  private vectorClock = new VectorClock()
  private statusCallbacks = new Set<StatusCallback>()
  private currentStatus: SyncStatus = {
    phase: 'idle',
    online: true,
    lastSync: null,
    pendingCount: 0,
    conflictsCount: 0,
  }
  private options: SyncEngineOptions = {}
  private pollInterval: ReturnType<typeof setInterval> | null = null
  private ws: WebSocket | null = null
  private syncSessions = new Map<string, SyncSession>()

  // -----------------------------------------------------------------------
  // Start the sync engine
  // -----------------------------------------------------------------------

  async start(options: SyncEngineOptions = {}): Promise<void> {
    if (this.running) return

    this.options = options
    this.nodeId = getNodeId()
    this.running = true

    // Load pending count
    const pending = await getPendingOperations()
    this.currentStatus.pendingCount = pending.length

    // Set up network detector
    const cleanup = networkDetector.init()
    networkDetector.subscribe((online) => {
      this.updateStatus({ online, phase: online ? 'idle' : 'offline' })
      if (online) {
        this.onReconnect()
      }
    })

    // Start periodic health ping
    if (options.serverUrl) {
      networkDetector.startPing(`${options.serverUrl}/api/health`, 30_000)
    }

    // Set up operation queue executor
    operationQueue.setExecutor(this.executeOperation.bind(this))
    await operationQueue.loadPendingCount()

    // Connect WebSocket if URL provided
    if (options.wsUrl) {
      this.connectWebSocket(options.wsUrl)
    }

    // Start polling as fallback
    if (options.pollIntervalMs && options.pollIntervalMs > 0) {
      this.startPolling(options.pollIntervalMs)
    }

    // Initial sync
    if (networkDetector.isOnline) {
      await this.performFullSync()
    }

    // Store cleanup for later
    this._cleanup = cleanup
  }

  private _cleanup: (() => void) | null = null

  // -----------------------------------------------------------------------
  // Stop the sync engine
  // -----------------------------------------------------------------------

  stop(): void {
    this.running = false
    networkDetector.stopPing()
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    if (this._cleanup) {
      this._cleanup()
      this._cleanup = null
    }
  }

  // -----------------------------------------------------------------------
  // Apply a local change
  // -----------------------------------------------------------------------

  async applyLocalChange(
    entityType: CRDTEntityType,
    entityId: string,
    changes: Record<string, unknown>,
    operationType: 'create' | 'update' | 'delete' = 'update',
  ): Promise<void> {
    // Increment lamport and vector clock
    this.lamportCounter++
    this.vectorClock.increment(this.nodeId)
    const timestamp = this.lamportCounter
    const vcState = this.vectorClock.toState()

    // Convert changes to LWW register states
    const fieldChanges: Record<string, LWWRegisterState<unknown>> = {}
    for (const [field, value] of Object.entries(changes)) {
      fieldChanges[field] = makeLWWState(value, this.nodeId, timestamp)
    }

    // Create operation
    const operation: CRDTOperation = {
      id: `op-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      entityType,
      entityId,
      operationType,
      changes: fieldChanges,
      lamportTimestamp: timestamp,
      vectorClock: vcState,
      nodeId: this.nodeId,
      createdAt: new Date().toISOString(),
    }

    // Apply optimistically to local CRDT
    this.applyToLocalCRDT(entityType, entityId, fieldChanges, operationType)

    // Apply optimistic update tracking
    optimisticManager.apply(entityType, entityId, changes)

    // Queue for sync
    await operationQueue.enqueue(operation)

    // Update status
    this.updateStatus({
      pendingCount: operationQueue.pendingCount,
      phase: networkDetector.isOnline ? 'syncing' : 'offline',
    })
  }

  // -----------------------------------------------------------------------
  // Get current sync status
  // -----------------------------------------------------------------------

  getStatus(): SyncStatus {
    return { ...this.currentStatus }
  }

  // -----------------------------------------------------------------------
  // Subscribe to status changes
  // -----------------------------------------------------------------------

  onSyncStatusChange(callback: StatusCallback): () => void {
    this.statusCallbacks.add(callback)
    callback(this.currentStatus)
    return () => this.statusCallbacks.delete(callback)
  }

  // -----------------------------------------------------------------------
  // Force a full sync
  // -----------------------------------------------------------------------

  async performFullSync(): Promise<void> {
    if (!networkDetector.isOnline) return

    this.updateStatus({ phase: 'syncing' })

    try {
      // 1. Flush pending operations
      await operationQueue.flush()

      // 2. Pull latest state from server for each entity type
      for (const entityType of ['transaction', 'invoice', 'category'] as CRDTEntityType[]) {
        await this.pullEntityType(entityType)
      }

      // 3. Update sync status
      this.updateStatus({
        phase: 'idle',
        lastSync: new Date().toISOString(),
        pendingCount: operationQueue.pendingCount,
      })
    } catch (err) {
      console.error('[SyncEngine] Full sync failed:', err)
      this.updateStatus({ phase: 'conflict' })
    }
  }

  // -----------------------------------------------------------------------
  // Internal: apply changes to local Yjs CRDT
  // -----------------------------------------------------------------------

  private applyToLocalCRDT(
    entityType: CRDTEntityType,
    entityId: string,
    fieldChanges: Record<string, LWWRegisterState<unknown>>,
    operationType: string,
  ): void {
    const yDoc = createYDoc(entityId, entityType)

    if (operationType === 'delete') {
      // Mark as tombstone
      const meta = yDoc.getMap('__meta__')
      meta.set('tombstone', true)
    } else {
      // Apply field updates
      applyFieldUpdates(yDoc, fieldChanges)
    }

    // Persist to IndexedDB
    this.persistYDoc(entityType, entityId, yDoc)
  }

  // -----------------------------------------------------------------------
  // Internal: persist a Yjs doc to local storage
  // -----------------------------------------------------------------------

  private async persistYDoc(
    entityType: CRDTEntityType,
    entityId: string,
    yDoc: ReturnType<typeof createYDoc>,
  ): Promise<void> {
    const fields = readFieldUpdates(yDoc)
    const vectorClock = readVectorClock(yDoc)
    const meta = yDoc.getMap('__meta__')
    const tombstone = (meta.get('tombstone') as boolean) ?? false

    const entity: BaseCRDT & { fields: Record<string, LWWRegisterState<unknown>> } = {
      id: entityId,
      lamportTimestamp: this.lamportCounter,
      vectorClock,
      tombstone,
      entityType,
      fields,
    }

    // Save to appropriate store
    switch (entityType) {
      case 'transaction':
        await saveTransaction(entity as any)
        break
      case 'invoice':
        await saveInvoice(entity as any)
        break
      case 'category':
        await saveCategory(entity as any)
        break
    }
  }

  // -----------------------------------------------------------------------
  // Internal: execute an operation against the server
  // -----------------------------------------------------------------------

  private async executeOperation(
    operation: CRDTOperation,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.options.serverUrl) {
      return { success: false, error: 'No server URL configured' }
    }

    try {
      const { entityType, entityId, operationType, changes } = operation

      let url: string
      let method: string
      let body: Record<string, unknown>

      switch (operationType) {
        case 'create':
          url = `${this.options.serverUrl}/api/${entityType}s`
          method = 'POST'
          body = this.changesToBody(changes)
          break
        case 'update':
          url = `${this.options.serverUrl}/api/${entityType}s/${entityId}`
          method = 'PUT'
          body = this.changesToBody(changes)
          break
        case 'delete':
          url = `${this.options.serverUrl}/api/${entityType}s/${entityId}`
          method = 'DELETE'
          body = {}
          break
        case 'status_transition':
          url = `${this.options.serverUrl}/api/${entityType}s/${entityId}`
          method = 'PATCH'
          body = this.changesToBody(changes)
          break
        default:
          return { success: false, error: `Unknown operation type: ${operationType}` }
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        // Commit the optimistic update
        optimisticManager.commit(entityType, entityId)

        // Update sync metadata
        const serverData = await response.json()
        const serverVersion = serverData?.lamportTimestamp ?? serverData?.version ?? 0
        await setLastSyncVersion(entityType, entityId, serverVersion, operation.vectorClock)

        return { success: true }
      } else {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.error ?? `Server returned ${response.status}`,
        }
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Network error',
      }
    }
  }

  // -----------------------------------------------------------------------
  // Internal: pull latest state from server for an entity type
  // -----------------------------------------------------------------------

  private async pullEntityType(entityType: CRDTEntityType): Promise<void> {
    if (!this.options.serverUrl) return

    try {
      const response = await fetch(`${this.options.serverUrl}/api/${entityType}s`, {
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) return

      const data = await response.json()
      const items = data.data ?? data

      for (const item of items) {
        await this.reconcileServerEntity(entityType, item)
      }
    } catch (err) {
      console.error(`[SyncEngine] Failed to pull ${entityType}:`, err)
    }
  }

  // -----------------------------------------------------------------------
  // Internal: reconcile a server entity with local state
  // -----------------------------------------------------------------------

  private async reconcileServerEntity(
    entityType: CRDTEntityType,
    serverData: Record<string, unknown>,
  ): Promise<void> {
    const entityId = serverData.id as string
    if (!entityId) return

    // Load local state
    let localEntity: BaseCRDT | null = null
    switch (entityType) {
      case 'transaction':
        localEntity = await getTransaction(entityId)
        break
      case 'invoice':
        localEntity = await getInvoice(entityId)
        break
      case 'category':
        localEntity = await getCategory(entityId)
        break
    }

    // Convert server data to CRDT fields
    const serverFields = this.serverDataToFields(serverData, entityType)
    const serverVC: VectorClockState = (serverData.vectorClock as VectorClockState) ?? [[this.nodeId, this.lamportCounter]]
    const serverLamport = (serverData.lamportTimestamp as number) ?? 0

    // Reconcile
    const result = reconcile(
      localEntity ? {
        id: localEntity.id,
        lamportTimestamp: localEntity.lamportTimestamp,
        vectorClock: localEntity.vectorClock,
        tombstone: localEntity.tombstone,
        entityType: localEntity.entityType,
        fields: (localEntity as any).fields ?? {},
      } : null,
      {
        id: entityId,
        lamportTimestamp: serverLamport,
        vectorClock: serverVC,
        tombstone: false,
        entityType,
        fields: serverFields,
      },
      this.nodeId,
    )

    // Apply reconciliation result
    if (result.action !== 'no_change') {
      await this.applyReconciliationResult(entityType, entityId, result)
    }
  }

  // -----------------------------------------------------------------------
  // Internal: apply reconciliation result
  // -----------------------------------------------------------------------

  private async applyReconciliationResult(
    entityType: CRDTEntityType,
    entityId: string,
    result: ReconciliationResult,
  ): Promise<void> {
    const yDoc = createYDoc(entityId, entityType)

    switch (result.action) {
      case 'fast_forward':
      case 'merge':
      case 'create_local':
        applyFieldUpdates(yDoc, result.mergedFields)
        await this.persistYDoc(entityType, entityId, yDoc)
        await setLastSyncVersion(entityType, entityId, result.newLamportTimestamp, result.newVectorClock)
        break
      case 'push_local':
        // Local is ahead — schedule push
        break
      case 'no_change':
        break
    }
  }

  // -----------------------------------------------------------------------
  // Internal: convert changes record to request body
  // -----------------------------------------------------------------------

  private changesToBody(changes: Record<string, LWWRegisterState<unknown>>): Record<string, unknown> {
    const body: Record<string, unknown> = {}
    for (const [field, state] of Object.entries(changes)) {
      body[field] = state.value
    }
    return body
  }

  // -----------------------------------------------------------------------
  // Internal: convert server data to CRDT field states
  // -----------------------------------------------------------------------

  private serverDataToFields(
    serverData: Record<string, unknown>,
    entityType: CRDTEntityType,
  ): Record<string, LWWRegisterState<unknown>> {
    const fields: Record<string, LWWRegisterState<unknown>> = {}
    const timestamp = (serverData.lamportTimestamp as number) ?? Date.now()
    const nodeId = (serverData.nodeId as string) ?? 'server'

    // Map server fields to LWW registers
    const fieldNames = this.getEntityFields(entityType)
    for (const field of fieldNames) {
      if (field in serverData) {
        fields[field] = makeLWWState(serverData[field], nodeId, timestamp)
      }
    }

    return fields
  }

  // -----------------------------------------------------------------------
  // Internal: get field names for an entity type
  // -----------------------------------------------------------------------

  private getEntityFields(entityType: CRDTEntityType): string[] {
    switch (entityType) {
      case 'transaction':
        return ['accountId', 'counterpartyId', 'categoryId', 'projectId', 'invoiceId', 'type', 'amount', 'description', 'reference', 'status', 'transactionDate']
      case 'invoice':
        return ['counterpartyId', 'number', 'status', 'type', 'amount', 'taxAmount', 'dueDate', 'issuedDate', 'description']
      case 'category':
        return ['name', 'type', 'icon', 'color', 'parentId', 'sortOrder']
      case 'counterparty':
        return ['name', 'inn', 'type', 'email', 'phone', 'address', 'contactPerson', 'notes']
      case 'project':
        return ['name', 'description', 'status', 'budget', 'startDate', 'endDate']
      default:
        return []
    }
  }

  // -----------------------------------------------------------------------
  // Internal: handle reconnection
  // -----------------------------------------------------------------------

  private async onReconnect(): Promise<void> {
    console.log('[SyncEngine] Reconnected — starting sync')
    this.updateStatus({ phase: 'syncing' })

    // Flush pending operations
    await operationQueue.flush()

    // Perform full sync
    await this.performFullSync()
  }

  // -----------------------------------------------------------------------
  // Internal: WebSocket connection
  // -----------------------------------------------------------------------

  private connectWebSocket(wsUrl: string): void {
    try {
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log('[SyncEngine] WebSocket connected')
        // Start sync session
        const session = new SyncSession(this.nodeId)
        this.syncSessions.set('ws', session)

        // Send Step 1
        const sv = this.vectorClock.toState()
        const msg = session.start(sv)
        this.ws?.send(serialiseSyncMessage(msg))
      }

      this.ws.onmessage = (event) => {
        try {
          const msg = parseSyncMessage(event.data as string)
          this.handleWSMessage(msg)
        } catch (err) {
          console.error('[SyncEngine] Failed to parse WS message:', err)
        }
      }

      this.ws.onclose = () => {
        console.log('[SyncEngine] WebSocket disconnected')
        this.syncSessions.delete('ws')
        // Reconnect after delay
        setTimeout(() => {
          if (this.running && this.options.wsUrl) {
            this.connectWebSocket(this.options.wsUrl)
          }
        }, 5000)
      }

      this.ws.onerror = (err) => {
        console.error('[SyncEngine] WebSocket error:', err)
      }
    } catch (err) {
      console.error('[SyncEngine] Failed to connect WebSocket:', err)
    }
  }

  // -----------------------------------------------------------------------
  // Internal: handle incoming WebSocket message
  // -----------------------------------------------------------------------

  private handleWSMessage(msg: import('../crdt/types').SyncMessage): void {
    const session = this.syncSessions.get('ws')
    if (!session) return

    switch (msg.type) {
      case 'sync_step_1': {
        const response = session.handleStep1(
          msg,
          (remoteSV) => {
            // Get the diff for the remote
            const sv = new TextEncoder().encode(JSON.stringify(remoteSV))
            // For now, return empty update — would need actual Yjs state
            return new Uint8Array(0)
          },
          this.vectorClock.toState(),
        )
        this.ws?.send(serialiseSyncMessage(response))
        break
      }
      case 'sync_step_2': {
        const response = session.handleStep2(msg, (update) => {
          // Apply the update to our local Yjs docs
          // This would iterate over all relevant docs and apply
          console.log('[SyncEngine] Received update, length:', update.length)
        })
        if (response.type === 'ack') {
          this.ws?.send(serialiseSyncMessage(response))
        }
        break
      }
      case 'sync_update': {
        session.handleUpdate(msg, (update, operation) => {
          console.log('[SyncEngine] Received incremental update for', operation.entityType, operation.entityId)
          // Apply to local CRDT and reconcile
        })
        break
      }
      case 'awareness': {
        // Handle awareness (presence) updates
        break
      }
      case 'ack': {
        // Acknowledgement — no action needed
        break
      }
    }
  }

  // -----------------------------------------------------------------------
  // Internal: polling fallback
  // -----------------------------------------------------------------------

  private startPolling(intervalMs: number): void {
    this.pollInterval = setInterval(() => {
      if (networkDetector.isOnline && this.running) {
        this.performFullSync().catch((err) => {
          console.error('[SyncEngine] Poll sync failed:', err)
        })
      }
    }, intervalMs)
  }

  // -----------------------------------------------------------------------
  // Internal: update status and notify subscribers
  // -----------------------------------------------------------------------

  private updateStatus(partial: Partial<SyncStatus>): void {
    this.currentStatus = { ...this.currentStatus, ...partial }
    for (const cb of this.statusCallbacks) {
      try {
        cb(this.currentStatus)
      } catch (err) {
        console.error('[SyncEngine] Status callback error:', err)
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const syncEngine = new SyncEngine()
