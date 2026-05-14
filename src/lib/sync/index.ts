// ============================================================================
// PULSE Fintech — Sync Module Barrel Export
// ============================================================================

export { syncEngine } from './engine'
export type { SyncEngineOptions } from './engine'
export { reconcile, mergeORSetStates, resolveStatusConflict } from './reconciler'
export type { EntityVersion, ReconciliationAction, ReconciliationResult, StatusTransition } from './reconciler'
export { optimisticManager } from './optimistic'
export type { OptimisticEvent, OptimisticEventType } from './optimistic'
export { backgroundSync } from './background'
