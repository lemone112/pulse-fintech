// ============================================================================
// PULSE Event Bus — Kafka Adapter (Stub)
// ============================================================================
// Kafka-compatible adapter that wraps the in-memory event bus.
// When deployed with real Kafka, this will be replaced with a kafkajs implementation.
//
// Design:
// - Same interface as in-memory bus
// - Will connect to real Kafka via kafkajs when deployed
// - For now, delegates to the in-memory bus
// - Produces events to Kafka topics (one topic per event type)
// - Consumes events from Kafka consumer groups

import type { PulseEvent, EventHandler, EventType } from './types'
import { eventBus } from './bus'

class KafkaAdapter {
  private isConnected = false
  private kafkaBrokers: string[] = []
  private topicPrefix = 'pulse.'

  constructor() {
    // Read Kafka config from env vars
    const brokers = process.env.KAFKA_BROKERS
    if (brokers) {
      this.kafkaBrokers = brokers.split(',')
    }

    this.isConnected = this.kafkaBrokers.length > 0
  }

  /**
   * Emit an event.
   * In production, this would produce to a Kafka topic.
   * For now, delegates to the in-memory bus.
   */
  async emit(event: PulseEvent): Promise<void> {
    if (this.isConnected) {
      // In production, produce to Kafka topic:
      // topic = `${this.topicPrefix}${event.type}`
      // await this.producer.send({
      //   topic,
      //   messages: [{ key: event.payload?.id, value: JSON.stringify(event) }],
      // })
      console.log(`[KafkaAdapter] Would produce to topic: ${this.topicPrefix}${event.type}`)
    }

    // Always emit to in-memory bus as well (for local handlers)
    eventBus.emit(event)
  }

  /**
   * Register a handler for a specific event type.
   * In production, this would subscribe to a Kafka consumer group.
   */
  on<T extends PulseEvent>(eventType: T['type'], handler: EventHandler<T>): () => void {
    // For now, delegate to in-memory bus
    return eventBus.on(eventType, handler)
  }

  /**
   * Register a handler for ALL event types (wildcard).
   */
  onAny(handler: EventHandler<PulseEvent>): () => void {
    return eventBus.onAny(handler)
  }

  /**
   * Get recent events from the in-memory log.
   */
  getRecentEvents(limit?: number): PulseEvent[] {
    return eventBus.getRecentEvents(limit)
  }

  /**
   * Get events of a specific type.
   */
  getEventsByType(eventType: EventType, limit?: number): PulseEvent[] {
    return eventBus.getEventsByType(eventType, limit)
  }

  /**
   * Check if Kafka is connected.
   */
  get connected(): boolean {
    return this.isConnected
  }

  /**
   * Get the Kafka topic name for an event type.
   */
  getTopicName(eventType: string): string {
    return `${this.topicPrefix}${eventType}`
  }
}

// Singleton instance
export const kafkaAdapter = new KafkaAdapter()

// Also export the raw event bus for direct access
export { eventBus } from './bus'
