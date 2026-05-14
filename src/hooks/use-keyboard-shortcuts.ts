'use client'

import { useEffect, useCallback, useRef } from 'react'

/** Custom event names dispatched by keyboard shortcuts */
export const SHORTCUT_EVENTS = {
  commandPalette: 'pulse:open-command-palette',
  newTransaction: 'pulse:new-transaction',
  newInvoice: 'pulse:new-invoice',
  focusSearch: 'pulse:focus-search',
  closeModals: 'pulse:close-modals',
} as const

export interface ShortcutHandlers {
  /** Cmd/Ctrl+K → Command palette */
  onCommandPalette?: () => void
  /** Cmd/Ctrl+N → New transaction (dispatches pulse:new-transaction custom event) */
  onNewTransaction?: () => void
  /** Cmd/Ctrl+Shift+N → New invoice (dispatches pulse:new-invoice custom event) */
  onNewInvoice?: () => void
  /** Cmd/Ctrl+/ → Focus search */
  onFocusSearch?: () => void
  /** Cmd/Ctrl+1-9 → Navigate to tabs/pages */
  onNavigate?: (index: number) => void
  /** Escape → Close modals/panels */
  onEscape?: () => void
}

/**
 * Global keyboard shortcut handler.
 * Registers shortcuts that work across the entire application.
 *
 * Shortcuts:
 * - Cmd/Ctrl+K       → Command palette (already wired)
 * - Cmd/Ctrl+N       → New transaction (dispatches pulse:new-transaction)
 * - Cmd/Ctrl+Shift+N → New invoice (dispatches pulse:new-invoice)
 * - Cmd/Ctrl+/       → Focus search
 * - Cmd/Ctrl+1-9     → Navigate to tab/page
 * - Escape           → Close modals/panels (dispatches pulse:close-modals)
 *
 * Handlers are optional (Partial<ShortcutHandlers>). When a handler is not
 * provided, the shortcut either dispatches a custom event (for new-transaction,
 * new-invoice, close-modals) or does nothing.
 */
export function useKeyboardShortcuts(handlers: Partial<ShortcutHandlers> = {}) {
  const handlersRef = useRef(handlers)

  useEffect(() => {
    handlersRef.current = handlers
  }) // intentionally no deps — syncs ref every render

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isMod = e.metaKey || e.ctrlKey
    const isShift = e.shiftKey

    // Don't intercept when typing in input/textarea unless it's Escape
    const target = e.target as HTMLElement
    const isInput =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable

    // Escape — works everywhere, dispatches close-modals event by default
    if (e.key === 'Escape') {
      if (handlersRef.current.onEscape) {
        handlersRef.current.onEscape()
      } else {
        window.dispatchEvent(new CustomEvent(SHORTCUT_EVENTS.closeModals))
      }
      return
    }

    // Don't intercept other shortcuts when typing
    if (isInput) return

    // Cmd+K → Command palette
    if (isMod && e.key === 'k' && !isShift) {
      e.preventDefault()
      handlersRef.current.onCommandPalette?.()
      return
    }

    // Cmd+N → New transaction (dispatches custom event if no handler)
    if (isMod && e.key === 'n' && !isShift) {
      e.preventDefault()
      if (handlersRef.current.onNewTransaction) {
        handlersRef.current.onNewTransaction()
      } else {
        window.dispatchEvent(new CustomEvent(SHORTCUT_EVENTS.newTransaction))
      }
      return
    }

    // Cmd+Shift+N → New invoice (dispatches custom event if no handler)
    if (isMod && e.key === 'N' && isShift) {
      e.preventDefault()
      if (handlersRef.current.onNewInvoice) {
        handlersRef.current.onNewInvoice()
      } else {
        window.dispatchEvent(new CustomEvent(SHORTCUT_EVENTS.newInvoice))
      }
      return
    }

    // Cmd+/ → Focus search
    if (isMod && e.key === '/') {
      e.preventDefault()
      handlersRef.current.onFocusSearch?.()
      return
    }

    // Cmd+1-9 → Navigate
    if (isMod && e.key >= '1' && e.key <= '9') {
      e.preventDefault()
      handlersRef.current.onNavigate?.(parseInt(e.key, 10) - 1)
      return
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
