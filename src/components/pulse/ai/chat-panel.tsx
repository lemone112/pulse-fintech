'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Paperclip, Wrench, Loader2, Bot, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { streamChat, type ChatMessage } from '@/lib/ai/client'
import ReactMarkdown from 'react-markdown'
import { Flex, Button as TremorButton } from '@tremor/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const QUICK_ACTIONS = [
  { label: 'Анализ транзакций', prompt: 'Проанализируй мои транзакции за последний месяц и выдели основные тенденции' },
  { label: 'Дебиторка', prompt: 'Покажи состояние дебиторской задолженности и выдели просроченные счета' },
  { label: 'Отчёт ПиУ', prompt: 'Составь отчёт о прибылях и убытках за текущий квартал' },
]

interface ChatPanelProps {
  onContextUpdate?: (context: string) => void
}

export function ChatPanel({ onContextUpdate }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Здравствуйте! Я AI-ассистент Pulse. Я могу помочь с анализом транзакций, составлением отчётов, поиском аномалий и другими задачами. Чем могу помочь?',
      timestamp: Date.now(),
    },
  ])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSend = useCallback(async (text?: string) => {
    const content = text || input.trim()
    if (!content || isStreaming) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    }

    const assistantId = `assistant-${Date.now()}`
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage, assistantMessage])
    setInput('')
    setIsStreaming(true)

    const abort = new AbortController()
    abortRef.current = abort

    await streamChat(
      [
        { role: 'system', content: 'Ты — AI-ассистент бухгалтерской платформы Pulse. Отвечай на русском языке. Помогай с анализом финансов, составлением отчётов, поиском аномалий в транзакциях.' },
        ...messages.filter((m) => m.role !== 'system').map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content },
      ],
      {
        onToken: (token) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + token } : m
            )
          )
        },
        onDone: () => {
          setIsStreaming(false)
          onContextUpdate?.(content)
        },
        onError: (error) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: `Ошибка: ${error.message}. Проверьте настройки AI-шлюза в разделе Настройки → Подключения.` }
                : m
            )
          )
          setIsStreaming(false)
        },
      },
      { signal: abort.signal }
    )
  }, [input, isStreaming, messages, onContextUpdate])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Flex flexDirection="col" className="h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="tremor-flex"
            >
              <Flex justifyContent={message.role === 'user' ? 'end' : 'start'} className="gap-3">
                {message.role === 'assistant' && (
                  <div className="h-8 w-8 rounded-full bg-tremor-brand-subtle flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-tremor-brand" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed',
                    message.role === 'user'
                      ? 'bg-tremor-brand text-tremor-brand-inverted'
                      : 'bg-tremor-background-muted text-tremor-content'
                  )}
                >
                  {message.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>{message.content || '...'}</ReactMarkdown>
                    </div>
                  ) : (
                    <p>{message.content}</p>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="h-8 w-8 rounded-full bg-tremor-background-muted flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-tremor-content-subtle" />
                  </div>
                )}
              </Flex>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                onClick={() => handleSend(action.prompt)}
                className="rounded-full border border-tremor-border px-3 py-1.5 text-xs text-tremor-content-subtle hover:bg-tremor-background-muted hover:text-tremor-content transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-tremor-border p-4">
        <Flex alignItems="end" className="gap-2">
          <Flex className="gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Wrench className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem>🔍 Поиск в интернете</DropdownMenuItem>
                <DropdownMenuItem>📊 Анализ транзакций</DropdownMenuItem>
                <DropdownMenuItem>📄 Генерация отчёта</DropdownMenuItem>
                <DropdownMenuItem>🔢 Расчёт налогов</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <TremorButton variant="light" size="sm" className="h-9 w-9" icon={Paperclip} />
          </Flex>
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Спросите что-нибудь о ваших финансах..."
              rows={1}
              className="w-full resize-none rounded-lg border border-tremor-border bg-tremor-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-tremor-ring placeholder:text-tremor-content-subtle min-h-10 max-h-[120px]"
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement
                target.style.height = 'auto'
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`
              }}
            />
          </div>
          <TremorButton
            onClick={() => handleSend()}
            disabled={!input.trim() || isStreaming}
            variant="primary"
            size="sm"
            className="h-9 w-9"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </TremorButton>
        </Flex>
      </div>
    </Flex>
  )
}
