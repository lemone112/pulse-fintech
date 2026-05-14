// ============================================================================
// PULSE Fintech — Network Status Detector
// ============================================================================
//
// Detects online/offline status using:
// 1. navigator.onLine — browser API
// 2. 'online' / 'offline' events — browser fires these on the window
// 3. Periodic ping — optional heartbeat to detect silent disconnects
//
// Usage:
//   import { networkDetector } from '@/lib/offline/network-detector'
//   networkDetector.isOnline  // boolean
//   networkDetector.subscribe((online) => { ... })
//   networkDetector.startPing('/api/health', 30_000)  // optional
// ============================================================================

type OnlineCallback = (online: boolean) => void

class NetworkDetector {
  private _isOnline = true
  private subscribers = new Set<OnlineCallback>()
  private pingInterval: ReturnType<typeof setInterval> | null = null
  private initialized = false

  // -----------------------------------------------------------------------
  // Current online status
  // -----------------------------------------------------------------------

  get isOnline(): boolean {
    return this._isOnline
  }

  // -----------------------------------------------------------------------
  // Initialise — must be called in a client component / useEffect
  // -----------------------------------------------------------------------

  init(): () => void {
    if (this.initialized || typeof window === 'undefined') {
      return () => {}
    }

    this.initialized = true
    this._isOnline = navigator.onLine

    const handleOnline = () => this.setOnline(true)
    const handleOffline = () => this.setOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Return cleanup function
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      this.stopPing()
      this.initialized = false
    }
  }

  // -----------------------------------------------------------------------
  // Subscribe to online/offline changes
  // -----------------------------------------------------------------------

  subscribe(callback: OnlineCallback): () => void {
    this.subscribers.add(callback)
    // Immediately call with current state
    callback(this._isOnline)
    return () => this.subscribers.delete(callback)
  }

  // -----------------------------------------------------------------------
  // Start periodic ping to detect silent disconnects
  // (e.g., WiFi connected but no internet, corporate proxy issues)
  // -----------------------------------------------------------------------

  startPing(url: string, intervalMs = 30_000): void {
    this.stopPing()

    this.pingInterval = setInterval(async () => {
      try {
        const response = await fetch(url, {
          method: 'HEAD',
          cache: 'no-store',
          signal: AbortSignal.timeout(5000),
        })
        this.setOnline(response.ok)
      } catch {
        this.setOnline(false)
      }
    }, intervalMs)
  }

  // -----------------------------------------------------------------------
  // Stop periodic ping
  // -----------------------------------------------------------------------

  stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }

  // -----------------------------------------------------------------------
  // Internal: update status and notify subscribers
  // -----------------------------------------------------------------------

  private setOnline(online: boolean): void {
    if (this._isOnline === online) return

    this._isOnline = online

    for (const cb of this.subscribers) {
      try {
        cb(online)
      } catch (err) {
        console.error('[NetworkDetector] Subscriber error:', err)
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const networkDetector = new NetworkDetector()
