// ============================================================================
// PULSE AI Gateway — Own gateway with 3-4 model classes
// ============================================================================
//
// Model classes:
// 1. Embedding model — for semantic search
// 2. Cheap model — fast responses, classification
// 3. Base model — balanced quality/speed
// 4. Frontier model — complex reasoning
//
// Gateway handles:
// - Request routing to appropriate model
// - Rate limiting per model
// - Token counting and usage tracking
// - Response caching for identical prompts
// - Fallback chain (frontier → base → cheap)

// === Types ===

export type ModelClass = 'embedding' | 'cheap' | 'base' | 'frontier'

export interface ChatRequest {
  messages: Array<{ role: string; content: string }>
  modelClass?: ModelClass
  model?: string              // Override specific model
  temperature?: number
  maxTokens?: number
  stream?: boolean
  signal?: AbortSignal
}

export interface ChatResponse {
  content: string
  model: string
  modelClass: ModelClass
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  cached: boolean
  latencyMs: number
}

export interface EmbedRequest {
  input: string | string[]
  modelClass?: ModelClass
}

export interface EmbedResponse {
  embeddings: number[][]
  model: string
  usage: {
    promptTokens: number
    totalTokens: number
  }
}

export interface ClassifyRequest {
  input: string
  labels: string[]
  modelClass?: ModelClass
}

export interface ClassifyResponse {
  label: string
  confidence: number
  scores: Record<string, number>
  model: string
}

export interface UsageRecord {
  model: string
  modelClass: ModelClass
  promptTokens: number
  completionTokens: number
  totalTokens: number
  cached: boolean
  timestamp: Date
  latencyMs: number
}

export interface RateLimitConfig {
  maxRequestsPerMinute: number
  maxTokensPerMinute: number
}

// === Configuration ===

const MODEL_CONFIG: Record<ModelClass, { name: string; fallback?: ModelClass }> = {
  embedding: {
    name: process.env.AI_MODEL_EMBEDDING || 'text-embedding-3-small',
  },
  cheap: {
    name: process.env.AI_MODEL_CHEAP || process.env.NEXT_PUBLIC_AI_MODEL_CHEAP || 'gpt-4o-mini',
    fallback: undefined, // Cheapest, no fallback
  },
  base: {
    name: process.env.AI_MODEL_BASE || process.env.NEXT_PUBLIC_AI_MODEL_BASE || 'gpt-4o',
    fallback: 'cheap',
  },
  frontier: {
    name: process.env.AI_MODEL_FRONTIER || process.env.NEXT_PUBLIC_AI_MODEL_FRONTIER || 'o3',
    fallback: 'base',
  },
}

const RATE_LIMITS: Record<ModelClass, RateLimitConfig> = {
  embedding: { maxRequestsPerMinute: 60, maxTokensPerMinute: 100000 },
  cheap: { maxRequestsPerMinute: 30, maxTokensPerMinute: 50000 },
  base: { maxRequestsPerMinute: 15, maxTokensPerMinute: 30000 },
  frontier: { maxRequestsPerMinute: 5, maxTokensPerMinute: 10000 },
}

// === AI Gateway Class ===

class AIGateway {
  private baseUrl: string
  private apiKey: string
  private usageLog: UsageRecord[] = []
  private maxUsageLogSize = 10000
  private cache = new Map<string, { content: string; timestamp: number }>()
  private cacheMaxAge = 5 * 60 * 1000   // 5 minutes
  private cacheMaxSize = 1000
  private rateLimitCounters = new Map<string, { count: number; tokens: number; windowStart: number }>()

  constructor() {
    this.baseUrl = process.env.AI_BASE_URL || process.env.NEXT_PUBLIC_AI_BASE_URL || ''
    this.apiKey = process.env.AI_API_KEY || process.env.NEXT_PUBLIC_AI_API_KEY || ''
  }

  // === Public API ===

  /**
   * Chat completion — route to appropriate model class.
   * Supports streaming via callbacks.
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const modelClass = request.modelClass || 'base'
    const startTime = Date.now()

    // Check cache for non-streaming requests
    if (!request.stream) {
      const cacheKey = this.getCacheKey(request)
      const cached = this.getFromCache(cacheKey)
      if (cached) {
        return {
          content: cached,
          model: this.getModelName(modelClass),
          modelClass,
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          cached: true,
          latencyMs: Date.now() - startTime,
        }
      }
    }

    // Try with fallback chain
    let currentClass: ModelClass | undefined = modelClass
    let lastError: Error | null = null

    while (currentClass) {
      try {
        const result = await this.makeChatRequest(request, currentClass)

        // Cache the result
        if (!request.stream) {
          const cacheKey = this.getCacheKey(request)
          this.setCache(cacheKey, result.content)
        }

        // Track usage
        this.trackUsage({
          model: result.model,
          modelClass: currentClass,
          promptTokens: result.usage.promptTokens,
          completionTokens: result.usage.completionTokens,
          totalTokens: result.usage.totalTokens,
          cached: false,
          timestamp: new Date(),
          latencyMs: Date.now() - startTime,
        })

        return result
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        console.warn(`[AIGateway] Model class ${currentClass} failed, trying fallback...`)

        // Try fallback
        currentClass = MODEL_CONFIG[currentClass].fallback
      }
    }

    throw lastError || new Error('Все модели недоступны')
  }

  /**
   * Embed text for semantic search.
   */
  async embed(request: EmbedRequest): Promise<EmbedResponse> {
    const modelClass: ModelClass = 'embedding'
    const model = this.getModelName(modelClass)
    const input = Array.isArray(request.input) ? request.input : [request.input]

    // Estimate tokens (rough: 1 token ≈ 4 chars)
    const promptTokens = input.reduce((sum, text) => sum + Math.ceil(text.length / 4), 0)

    this.trackUsage({
      model,
      modelClass,
      promptTokens,
      completionTokens: 0,
      totalTokens: promptTokens,
      cached: false,
      timestamp: new Date(),
      latencyMs: 0,
    })

    // In production, make actual API call to embedding model
    // For now, return stub embeddings
    return {
      embeddings: input.map(() => new Array(1536).fill(0)),
      model,
      usage: { promptTokens, totalTokens: promptTokens },
    }
  }

  /**
   * Classify text into predefined categories.
   */
  async classify(request: ClassifyRequest): Promise<ClassifyResponse> {
    const modelClass = request.modelClass || 'cheap'

    // Use chat API with classification prompt
    const prompt = `Классифицируй следующий текст в одну из категорий: ${request.labels.join(', ')}.\n\nТекст: ${request.input}\n\nОтветь только названием категории.`

    const response = await this.chat({
      messages: [{ role: 'user', content: prompt }],
      modelClass,
      temperature: 0,
      maxTokens: 50,
    })

    // Parse the classification result
    const label = response.content.trim()
    const match = request.labels.find((l) =>
      l.toLowerCase() === label.toLowerCase() || label.toLowerCase().includes(l.toLowerCase())
    )

    return {
      label: match || label,
      confidence: match ? 0.9 : 0.5,
      scores: request.labels.reduce((acc, l) => {
        acc[l] = l === match ? 0.9 : 0.1 / (request.labels.length - 1)
        return acc
      }, {} as Record<string, number>),
      model: response.model,
    }
  }

  /**
   * Get usage statistics.
   */
  getUsageStats(): {
    totalRequests: number
    totalTokens: number
    byModel: Record<string, { requests: number; tokens: number; avgLatencyMs: number }>
    cacheHitRate: number
  } {
    const byModel: Record<string, { requests: number; tokens: number; totalLatency: number }> = {}
    let totalTokens = 0
    let cacheHits = 0

    for (const record of this.usageLog) {
      if (!byModel[record.model]) {
        byModel[record.model] = { requests: 0, tokens: 0, totalLatency: 0 }
      }
      byModel[record.model].requests++
      byModel[record.model].tokens += record.totalTokens
      byModel[record.model].totalLatency += record.latencyMs
      totalTokens += record.totalTokens
      if (record.cached) cacheHits++
    }

    return {
      totalRequests: this.usageLog.length,
      totalTokens,
      byModel: Object.fromEntries(
        Object.entries(byModel).map(([model, data]) => [
          model,
          {
            requests: data.requests,
            tokens: data.tokens,
            avgLatencyMs: Math.round(data.totalLatency / data.requests),
          },
        ])
      ),
      cacheHitRate: this.usageLog.length > 0 ? cacheHits / this.usageLog.length : 0,
    }
  }

  /**
   * Get the model name for a model class.
   */
  getModelName(modelClass: ModelClass): string {
    return MODEL_CONFIG[modelClass].name
  }

  // === Private Methods ===

  private async makeChatRequest(
    request: ChatRequest,
    modelClass: ModelClass
  ): Promise<ChatResponse> {
    const model = request.model || this.getModelName(modelClass)
    const startTime = Date.now()

    if (!this.baseUrl) {
      throw new Error('AI gateway не настроен')
    }

    // Rate limit check
    this.checkRateLimit(modelClass)

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens,
        stream: false,
      }),
      signal: request.signal,
    })

    if (!response.ok) {
      throw new Error(`AI API ошибка: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }

    return {
      content,
      model: data.model || model,
      modelClass,
      usage: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
      },
      cached: false,
      latencyMs: Date.now() - startTime,
    }
  }

  private checkRateLimit(modelClass: ModelClass): void {
    const config = RATE_LIMITS[modelClass]
    const now = Date.now()
    const windowMs = 60000 // 1 minute

    const counter = this.rateLimitCounters.get(modelClass) || { count: 0, tokens: 0, windowStart: now }

    // Reset window if expired
    if (now - counter.windowStart > windowMs) {
      counter.count = 0
      counter.tokens = 0
      counter.windowStart = now
    }

    counter.count++
    this.rateLimitCounters.set(modelClass, counter)

    if (counter.count > config.maxRequestsPerMinute) {
      throw new Error(`Превышен лимит запросов для модели ${modelClass}: ${config.maxRequestsPerMinute}/мин`)
    }
  }

  private trackUsage(record: UsageRecord): void {
    this.usageLog.push(record)
    if (this.usageLog.length > this.maxUsageLogSize) {
      this.usageLog.shift()
    }
  }

  private getCacheKey(request: ChatRequest): string {
    const messagesStr = JSON.stringify(request.messages)
    const modelStr = request.model || request.modelClass || 'base'
    return `${modelStr}:${messagesStr}`
  }

  private getFromCache(key: string): string | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    if (Date.now() - entry.timestamp > this.cacheMaxAge) {
      this.cache.delete(key)
      return null
    }
    return entry.content
  }

  private setCache(key: string, content: string): void {
    this.cache.set(key, { content, timestamp: Date.now() })
    if (this.cache.size > this.cacheMaxSize) {
      // Remove oldest entries
      const keys = [...this.cache.keys()]
      for (let i = 0; i < keys.length / 2; i++) {
        this.cache.delete(keys[i])
      }
    }
  }
}

// Singleton instance
export const aiGateway = new AIGateway()
