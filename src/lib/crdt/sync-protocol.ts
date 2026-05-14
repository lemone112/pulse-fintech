// ============================================================================
// PULSE Fintech — Sync Protocol
// ============================================================================
//
// Sync protocol for exchanging CRDT state between nodes.
// Based on the Yjs sync protocol but adapted for our use case.
//
// Three-step sync:
//   Step 1: Exchange state vectors
//   Step 2: Send missing updates based on received state vector
//   Step 3: Apply received updates
//
// Supports:
//   - Full sync: exchange complete state (on first connect or re-connect)
//   - Incremental sync: exchange only missing updates (steady state)
//   - Awareness sync: exchange presence information
//
// All messages are serialisable to JSON for transport over any channel
// (WebSocket, HTTP, etc.)
// ============================================================================

import type {
  SyncMessage,
  SyncMessageType,
  VectorClockState,
  CRDTOperation,
  CRDTEntityType,
} from './types'
import { VectorClock } from './vector-clock'

// ---------------------------------------------------------------------------
// Message builders
// ---------------------------------------------------------------------------

/** Step 1: Send our state vector so the remote can compute the diff */
export function createSyncStep1(senderNodeId: string, stateVector: VectorClockState): SyncMessage {
  return {
    type: 'sync_step_1',
    senderNodeId,
    payload: { stateVector },
  }
}

/** Step 2: Send the missing updates based on the remote's state vector */
export function createSyncStep2(
  senderNodeId: string,
  update: Uint8Array,
  stateVector: VectorClockState,
): SyncMessage {
  return {
    type: 'sync_step_2',
    senderNodeId,
    payload: {
      update: Array.from(update), // serialise Uint8Array to number[]
      stateVector,
    },
  }
}

/** Send a single update (incremental sync) */
export function createSyncUpdate(
  senderNodeId: string,
  update: Uint8Array,
  operation: CRDTOperation,
): SyncMessage {
  return {
    type: 'sync_update',
    senderNodeId,
    payload: {
      update: Array.from(update),
      operation,
    },
  }
}

/** Send awareness information */
export function createAwarenessMessage(
  senderNodeId: string,
  awareness: unknown,
): SyncMessage {
  return {
    type: 'awareness',
    senderNodeId,
    payload: awareness,
  }
}

/** Acknowledge a received message */
export function createAck(senderNodeId: string, originalType: SyncMessageType): SyncMessage {
  return {
    type: 'ack',
    senderNodeId,
    payload: { originalType },
  }
}

// ---------------------------------------------------------------------------
// Message parsing
// ---------------------------------------------------------------------------

export function parseSyncMessage(raw: string): SyncMessage {
  return JSON.parse(raw) as SyncMessage
}

export function serialiseSyncMessage(msg: SyncMessage): string {
  return JSON.stringify(msg)
}

// ---------------------------------------------------------------------------
// Sync state machine — tracks the progress of a sync session
// ---------------------------------------------------------------------------

export type SyncSessionState = 'idle' | 'step1_sent' | 'step2_sent' | 'complete' | 'error'

export class SyncSession {
  state: SyncSessionState = 'idle'
  localNodeId: string
  remoteNodeId: string | null = null
  localStateVector: VectorClock | null = null
  remoteStateVector: VectorClock | null = null
  errors: string[] = []

  constructor(localNodeId: string) {
    this.localNodeId = localNodeId
  }

  // -----------------------------------------------------------------------
  // Start a sync session — send Step 1
  // -----------------------------------------------------------------------

  start(localStateVector: VectorClockState): SyncMessage {
    this.state = 'step1_sent'
    this.localStateVector = VectorClock.fromState(localStateVector)
    return createSyncStep1(this.localNodeId, localStateVector)
  }

  // -----------------------------------------------------------------------
  // Handle incoming Step 1 — respond with Step 2
  // -----------------------------------------------------------------------

  handleStep1(
    message: SyncMessage,
    getUpdateForStateVector: (sv: VectorClockState) => Uint8Array,
    localStateVector: VectorClockState,
  ): SyncMessage {
    if (message.type !== 'sync_step_1') {
      this.errors.push(`Expected sync_step_1, got ${message.type}`)
      this.state = 'error'
      return createAck(this.localNodeId, message.type)
    }

    this.remoteNodeId = message.senderNodeId
    this.remoteStateVector = VectorClock.fromState(
      (message.payload as { stateVector: VectorClockState }).stateVector,
    )

    // Compute the diff the remote needs
    const remoteSV = (message.payload as { stateVector: VectorClockState }).stateVector
    const remoteSVUint8 = vectorClockToUint8(remoteSV)
    const update = getUpdateForStateVector(remoteSV)

    this.state = 'step2_sent'
    return createSyncStep2(this.localNodeId, update, localStateVector)
  }

  // -----------------------------------------------------------------------
  // Handle incoming Step 2 — apply the update
  // -----------------------------------------------------------------------

  handleStep2(
    message: SyncMessage,
    applyUpdate: (update: Uint8Array) => void,
  ): SyncMessage {
    if (message.type !== 'sync_step_2') {
      this.errors.push(`Expected sync_step_2, got ${message.type}`)
      this.state = 'error'
      return createAck(this.localNodeId, message.type)
    }

    const payload = message.payload as {
      update: number[]
      stateVector: VectorClockState
    }

    const update = new Uint8Array(payload.update)
    applyUpdate(update)

    this.remoteStateVector = VectorClock.fromState(payload.stateVector)
    this.state = 'complete'

    return createAck(this.localNodeId, 'sync_step_2')
  }

  // -----------------------------------------------------------------------
  // Handle incoming incremental update
  // -----------------------------------------------------------------------

  handleUpdate(
    message: SyncMessage,
    applyUpdate: (update: Uint8Array, operation: CRDTOperation) => void,
  ): void {
    if (message.type !== 'sync_update') return

    const payload = message.payload as {
      update: number[]
      operation: CRDTOperation
    }

    const update = new Uint8Array(payload.update)
    applyUpdate(update, payload.operation)
  }

  // -----------------------------------------------------------------------
  // Determine what kind of sync is needed
  // -----------------------------------------------------------------------

  determineSyncNeed(remoteSV: VectorClockState, localSV: VectorClockState): {
    localNeedsUpdate: boolean
    remoteNeedsUpdate: boolean
  } {
    const local = VectorClock.fromState(localSV)
    const remote = VectorClock.fromState(remoteSV)

    const localHbRemote = local.happensBefore(remote)
    const remoteHbLocal = remote.happensBefore(local)

    return {
      localNeedsUpdate: !localHbRemote && !local.equals(remote),
      remoteNeedsUpdate: !remoteHbLocal && !local.equals(remote),
    }
  }
}

// ---------------------------------------------------------------------------
// Utility — encode vector clock as a simple byte array for Yjs
// (We use JSON-based encoding since our vector clocks are small)
// ---------------------------------------------------------------------------

export function vectorClockToUint8(vc: VectorClockState): Uint8Array {
  const json = JSON.stringify(vc)
  return new TextEncoder().encode(json)
}

export function uint8ToVectorClock(data: Uint8Array): VectorClockState {
  const json = new TextDecoder().decode(data)
  return JSON.parse(json) as VectorClockState
}

// ---------------------------------------------------------------------------
// Entity-level sync — determine which entities need syncing
// ---------------------------------------------------------------------------

export interface EntitySyncStatus {
  entityType: CRDTEntityType
  entityId: string
  localVersion: number
  remoteVersion: number
  needsSync: boolean
}

export function computeEntitySyncNeeds(
  localVersions: Array<{ entityType: CRDTEntityType; entityId: string; version: number }>,
  remoteVersions: Array<{ entityType: CRDTEntityType; entityId: string; version: number }>,
): EntitySyncStatus[] {
  const remoteMap = new Map(
    remoteVersions.map((v) => [`${v.entityType}:${v.entityId}`, v.version]),
  )

  return localVersions.map((local) => {
    const key = `${local.entityType}:${local.entityId}`
    const remoteVer = remoteMap.get(key) ?? 0
    return {
      entityType: local.entityType,
      entityId: local.entityId,
      localVersion: local.version,
      remoteVersion: remoteVer,
      needsSync: local.version !== remoteVer,
    }
  })
}
