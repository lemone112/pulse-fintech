// ============================================================================
// PULSE Fintech — Persistence Module Barrel Export
// ============================================================================

export { persistence } from './indexeddb'
export type {
  StoredDocument,
  StoredPendingOp,
  StoredSyncMeta,
  StoredCacheEntry,
} from './indexeddb'
export {
  getNodeId,
  getTransaction,
  getAllTransactions,
  saveTransaction,
  createTransactionCRDT,
  getInvoice,
  getAllInvoices,
  saveInvoice,
  createInvoiceCRDT,
  getCategory,
  getAllCategories,
  saveCategory,
  getPendingOperations,
  savePendingOperation,
  removePendingOperation,
  incrementRetryCount,
  getLastSyncVersion,
  setLastSyncVersion,
  getCachedResponse,
  setCachedResponse,
  clearAllData,
} from './local-store'
