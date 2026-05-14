'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { PanelRightOpen, PanelRightClose } from 'lucide-react'
import { Title, Text, Flex, Button } from '@tremor/react'
import { ChatPanel } from '@/components/pulse/ai/chat-panel'
import { ContextPanel } from '@/components/pulse/ai/context-panel'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

export default function AIPage() {
  const [showContext, setShowContext] = useState(true)
  const [recentQuery, setRecentQuery] = useState<string>()

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col h-full"
    >
      {/* Header */}
      <Flex justifyContent="between" alignItems="center" className="border-b border-tremor-border px-6 py-4">
        <div>
          <Title>AI Ассистент</Title>
          <Text className="text-tremor-content-subtle mt-0.5 text-sm">Интеллектуальный помощник для финансового анализа</Text>
        </div>
        <Button
          variant="light"
          size="sm"
          icon={showContext ? PanelRightClose : PanelRightOpen}
          onClick={() => setShowContext(!showContext)}
          title={showContext ? 'Скрыть панель контекста' : 'Показать панель контекста'}
          className="h-9 w-9 p-0"
        />
      </Flex>

      {/* Body */}
      <Flex className="flex-1 min-h-0">
        {/* Chat */}
        <div className="flex-1 min-w-0">
          <ChatPanel onContextUpdate={setRecentQuery} />
        </div>

        {/* Context panel */}
        <motion.div
          initial={false}
          animate={{ width: showContext ? 320 : 0, opacity: showContext ? 1 : 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="border-l border-tremor-border overflow-hidden shrink-0"
        >
          <div className="w-80 h-full">
            <ContextPanel
              recentQuery={recentQuery}
              onSuggestionClick={(prompt) => {
                // This would need to be wired to the chat panel via a ref or state
                console.log('Suggestion clicked:', prompt)
              }}
            />
          </div>
        </motion.div>
      </Flex>
    </motion.div>
  )
}
