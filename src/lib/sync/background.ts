// ============================================================================
// PULSE Fintech — Background Sync
// ============================================================================
//
// Background sync when connectivity is restored.
//
// Flow:
// 1. Detect online status
// 2. Flush pending operations in order
// 3. Pull latest changes from server
// 4. Reconcile any conflicts
// 5. Notify UI of sync completion
//
// Uses:
// - navigator.serviceWorker.sync if available (Service Worker Background Sync API)
// - Otherwise, manual polling with exponential backoff
// ============================================================================

import { networkDetector } from '../offline/network-detector'
import { operationQueue } from '../offline/queue'
import { syncEngine } from './engine'
import type { SyncStatus } from '../crdt/types'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const DEFAULT_BACKOFF_MS = 1000
const MAX_BACKOFF_MS = 60_000
const BACKOFF_MULTIPLIER = 2

// ---------------------------------------------------------------------------
// Background sync state
// ---------------------------------------------------------------------------

class BackgroundSync {
  private active = false
  private backoffMs = DEFAULT_BACKOFF_MS
  private retryTimeout: ReturnType<typeof setTimeout> | null = null
  private syncInProgress = false

  // -----------------------------------------------------------------------
  // Start background sync monitoring
  // -----------------------------------------------------------------------

  start(): void {
    if (this.active) return
    this.active = true

    // Listen for online events to trigger immediate sync
    networkDetector.subscribe((online) => {
      if (online && this.active) {
        this.backoffMs = DEFAULT_BACKOFF_MS
        this.triggerSync()
      }
    })

    // Try to register Service Worker Background Sync
    this.registerServiceWorkerSync()

    console.log('[BackgroundSync] Started')
  }

  // -----------------------------------------------------------------------
  // Stop background sync
  // -----------------------------------------------------------------------

  stop(): void {
    this.active = false
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout)
      this.retryTimeout = null
    }
    console.log('[BackgroundSync] Stopped')
  }

  // -----------------------------------------------------------------------
  // Manually trigger a sync (e.g., user-initiated)
  // -----------------------------------------------------------------------

  async triggerSync(): Promise<SyncStatus> {
    if (this.syncInProgress) {
      return syncEngine.getStatus()
    }

    if (!networkDetector.isOnline) {
      return syncEngine.getStatus()
    }

    this.syncInProgress = true

    try {
      // Step 1: Flush pending operations
      await operationQueue.flush()

      // Step 2: Perform full sync (pull + reconcile)
      await syncEngine.performFullSync()

      // Reset backoff on success
      this.backoffMs = DEFAULT_BACKOFF_MS

      return syncEngine.getStatus()
    } catch (err) {
      console.error('[BackgroundSync] Sync failed:', err)

      // Schedule retry with exponential backoff
      this.scheduleRetry()

      return syncEngine.getStatus()
    } finally {
      this.syncInProgress = false
    }
  }

  // -----------------------------------------------------------------------
  // Register Service Worker Background Sync (if available)
  // -----------------------------------------------------------------------

  private async registerServiceWorkerSync(): Promise<void> {
    if (typeof navigator === 'undefined') return

    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready
        // Background Sync API — not all browsers support registration.sync
        if ('sync' in registration) {
          await (registration as unknown as { sync: { register: (tag: string) => Promise<void> } }).sync.register('pulse-sync')
          console.log('[BackgroundSync] Service Worker sync registered')
        }
      } catch (err) {
        console.warn('[BackgroundSync] Service Worker sync not available:', err)
      }
    }
  }

  // -----------------------------------------------------------------------
  // Schedule a retry with exponential backoff
  // -----------------------------------------------------------------------

  private scheduleRetry(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout)
    }

    console.log(`[BackgroundSync] Retrying in ${this.backoffMs}ms`)

    this.retryTimeout = setTimeout(() => {
      if (this.active && networkDetector.isOnline) {
        this.triggerSync()
      }
    }, this.backoffMs)

    // Increase backoff
    this.backoffMs = Math.min(this.backoffMs * BACKOFF_MULTIPLIER, MAX_BACKOFF_MS)
  }

  // -----------------------------------------------------------------------
  // Check if a sync is currently in progress
  // -----------------------------------------------------------------------

  get isSyncing(): boolean {
    return this.syncInProgress
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const backgroundSync = new BackgroundSync()
