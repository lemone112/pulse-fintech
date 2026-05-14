'use client'

import { aiConfig } from './config'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  tools?: string[]
}

export interface StreamCallbacks {
  onToken: (token: string) => void
  onDone: () => void
  onError: (error: Error) => void
}

/**
 * AI client for streaming chat completions.
 * Connects to user's AI gateway.
 */
export async function streamChat(
  messages: Array<{ role: string; content: string }>,
  callbacks: StreamCallbacks,
  options?: {
    model?: string
    tools?: string[]
    signal?: AbortSignal
  }
): Promise<void> {
  const { baseUrl, apiKey } = aiConfig

  if (!baseUrl) {
    callbacks.onError(new Error('AI gateway not configured'))
    return
  }

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: options?.model || aiConfig.models.base,
        messages,
        stream: true,
        ...(options?.tools?.length ? { tools: options.tools.map(t => ({ type: 'function', function: { name: t } })) } : {}),
      }),
      signal: options?.signal,
    })

    if (!res.ok) {
      throw new Error(`AI API error: ${res.status}`)
    }

    const reader = res.body?.getReader()
    if (!reader) {
      throw new Error('No response stream')
    }

    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n').filter((l) => l.startsWith('data: '))

      for (const line of lines) {
        const data = line.slice(6)
        if (data === '[DONE]') {
          callbacks.onDone()
          return
        }

        try {
          const parsed = JSON.parse(data)
          const token = parsed.choices?.[0]?.delta?.content
          if (token) {
            callbacks.onToken(token)
          }
        } catch {
          // Skip malformed chunks
        }
      }
    }

    callbacks.onDone()
  } catch (error) {
    if (error instanceof Error && error.name !== 'AbortError') {
      callbacks.onError(error)
    }
  }
}

/**
 * Send a non-streaming chat completion request.
 */
export async function chatCompletion(
  messages: Array<{ role: string; content: string }>,
  options?: { model?: string }
): Promise<string> {
  const { baseUrl, apiKey } = aiConfig

  if (!baseUrl) {
    throw new Error('AI gateway not configured')
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: options?.model || aiConfig.models.cheap,
      messages,
      stream: false,
    }),
  })

  if (!res.ok) {
    throw new Error(`AI API error: ${res.status}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}
