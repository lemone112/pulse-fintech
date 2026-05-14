// ============================================================================
// PULSE Event Bus — In-process event bus (Kafka-compatible interface)
// ============================================================================
// Simple in-process event bus using Node.js EventEmitter.
// Interface is designed to be swapped for Kafka when ready.

import { EventEmitter } from 'events'
import type { PulseEvent, EventHandler, EventType } from './types'

const MAX_LISTENERS = 100

class EventBus {
  private emitter: EventEmitter
  private eventLog: PulseEvent[] = []
  private maxLogSize = 1000

  constructor() {
    this.emitter = new EventEmitter()
    this.emitter.setMaxListeners(MAX_LISTENERS)
  }

  /**
   * Emit an event to all registered handlers.
   * Handlers are called asynchronously — errors are caught and logged.
   */
  emit(event: PulseEvent): void {
    // Log the event (capped at maxLogSize)
    this.eventLog.push(event)
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.shift()
    }

    // Emit to all handlers for this event type
    this.emitter.emit(event.type, event)

    // Also emit to wildcard handlers
    this.emitter.emit('*', event)
  }

  /**
   * Register a handler for a specific event type.
   * Returns an unsubscribe function.
   */
  on<T extends PulseEvent>(eventType: T['type'], handler: EventHandler<T>): () => void {
    const wrappedHandler = (event: PulseEvent) => {
      try {
        const result = handler(event as T)
        if (result instanceof Promise) {
          result.catch((error) => {
            console.error(`[EventBus] Error in handler for ${eventType}:`, error)
          })
        }
      } catch (error) {
        console.error(`[EventBus] Error in handler for ${eventType}:`, error)
      }
    }

    this.emitter.on(eventType, wrappedHandler)

    // Return unsubscribe function
    return () => {
      this.emitter.off(eventType, wrappedHandler)
    }
  }

  /**
   * Register a handler for ALL event types (wildcard).
   * Returns an unsubscribe function.
   */
  onAny(handler: EventHandler<PulseEvent>): () => void {
    const wrappedHandler = (event: PulseEvent) => {
      try {
        const result = handler(event)
        if (result instanceof Promise) {
          result.catch((error) => {
            console.error('[EventBus] Error in wildcard handler:', error)
          })
        }
      } catch (error) {
        console.error('[EventBus] Error in wildcard handler:', error)
      }
    }

    this.emitter.on('*', wrappedHandler)

    return () => {
      this.emitter.off('*', wrappedHandler)
    }
  }

  /**
   * Get recent events from the log.
   */
  getRecentEvents(limit?: number): PulseEvent[] {
    const events = limit ? this.eventLog.slice(-limit) : this.eventLog
    return [...events]
  }

  /**
   * Get events of a specific type from the log.
   */
  getEventsByType(eventType: EventType, limit?: number): PulseEvent[] {
    const filtered = this.eventLog.filter((e) => e.type === eventType)
    return limit ? filtered.slice(-limit) : filtered
  }

  /**
   * Clear the event log.
   */
  clearLog(): void {
    this.eventLog = []
  }

  /**
   * Get the number of registered handlers for a specific event type.
   */
  listenerCount(eventType: string): number {
    return this.emitter.listenerCount(eventType)
  }
}

// Singleton instance
export const eventBus = new EventBus()
