import { NextRequest } from 'next/server'

// Server-only AI config — reads from env vars that are NOT exposed to the client
const AI_BASE_URL = process.env.AI_BASE_URL || process.env.NEXT_PUBLIC_AI_BASE_URL || ''
const AI_API_KEY = process.env.AI_API_KEY || process.env.NEXT_PUBLIC_AI_API_KEY || ''

const AI_MODELS: Record<string, string> = {
  cheap: process.env.AI_MODEL_CHEAP || process.env.NEXT_PUBLIC_AI_MODEL_CHEAP || 'gpt-4o-mini',
  base: process.env.AI_MODEL_BASE || process.env.NEXT_PUBLIC_AI_MODEL_BASE || 'gpt-4o',
  frontier: process.env.AI_MODEL_FRONTIER || process.env.NEXT_PUBLIC_AI_MODEL_FRONTIER || 'o3',
}

// POST /api/ai/chat — Server-side AI proxy (hides API key from client)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, model: modelKey } = body as {
      messages: Array<{ role: string; content: string }>
      model?: string
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!AI_BASE_URL) {
      return new Response(JSON.stringify({ error: 'AI gateway not configured' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const model = AI_MODELS[modelKey || 'base'] || modelKey || AI_MODELS.base

    // Forward to AI gateway with server-side API key
    const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(AI_API_KEY ? { Authorization: `Bearer ${AI_API_KEY}` } : {}),
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
      }),
      signal: request.signal, // Forward abort signal
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error('[AI Proxy] Upstream error:', response.status, errorText)
      return new Response(
        JSON.stringify({ error: `AI API error: ${response.status}` }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Stream SSE response back to client
    const encoder = new TextEncoder()
    const reader = response.body?.getReader()

    if (!reader) {
      return new Response(JSON.stringify({ error: 'No response stream' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const stream = new ReadableStream({
      async start(controller) {
        const decoder = new TextDecoder()

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              controller.close()
              break
            }

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n').filter((l: string) => l.startsWith('data: '))

            for (const line of lines) {
              const data = line.slice(6)
              if (data === '[DONE]') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                controller.close()
                return
              }

              try {
                const parsed = JSON.parse(data)
                const token = parsed.choices?.[0]?.delta?.content
                if (token) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ content: token })}\n\n`)
                  )
                }
              } catch {
                // Skip malformed chunks
              }
            }

            // Forward any non-data lines as-is for robustness
            const nonDataLines = chunk
              .split('\n')
              .filter((l: string) => l.trim() && !l.startsWith('data: '))
            for (const line of nonDataLines) {
              controller.enqueue(encoder.encode(`${line}\n`))
            }
          }
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            // Client disconnected — normal, just close
          } else {
            console.error('[AI Proxy] Stream error:', error)
          }
          controller.close()
        }
      },

      cancel() {
        reader.cancel()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return new Response(null, { status: 204 })
    }
    console.error('[AI Proxy] Error:', error)
    return new Response(JSON.stringify({ error: 'AI chat request failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
