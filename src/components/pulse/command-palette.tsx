'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command'

export function CommandMenuTrigger({ onSelect }: { onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="flex items-center gap-2 rounded-tremor-default border border-tremor-border px-3 py-1.5 text-sm text-tremor-content-subtle hover:bg-tremor-background-muted transition-colors w-full"
    >
      <span className="text-xs text-tremor-content-subtle">⌘K</span>
      <span>Поиск...</span>
    </button>
  )
}

export function CommandMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay — Tremor-compatible with backdrop blur for native feel */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          {/* Command palette container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="fixed left-1/2 top-[20%] -translate-x-1/2 z-50 w-full max-w-lg"
          >
            <Command className="rounded-xl border border-tremor-border bg-tremor-background text-tremor-content shadow-tremor-dropdown dark:shadow-dark-tremor-dropdown overflow-hidden">
              <CommandInput placeholder="Поиск транзакций, контрагентов, отчётов..." />
              <CommandList className="max-h-80 custom-scrollbar">
                <CommandEmpty>Ничего не найдено</CommandEmpty>

                <CommandGroup heading="Навигация">
                  <CommandItem>📊 Аналитика</CommandItem>
                  <CommandItem>💳 Транзакции</CommandItem>
                  <CommandItem>📄 Документы</CommandItem>
                  <CommandItem>🤖 AI Ассистент</CommandItem>
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Действия">
                  <CommandItem>➕ Новая транзакция</CommandItem>
                  <CommandItem>📤 Экспорт отчёта</CommandItem>
                  <CommandItem>⚙️ Настройки</CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
