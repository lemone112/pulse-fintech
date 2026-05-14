'use client'

// ============================================================================
// PULSE Fintech — useUndoRedo Hook
// ============================================================================
//
// React hook for undo/redo functionality.
// Works with the CRDT history manager.
// Keyboard shortcuts: Cmd+Z / Cmd+Shift+Z (Mac), Ctrl+Z / Ctrl+Shift+Z (Win)
// ============================================================================

import { useEffect, useCallback, useState } from 'react'
import { historyManager } from '@/lib/crdt/history'
import type { HistoryOperation } from '@/lib/crdt/history'

// ---------------------------------------------------------------------------
// Hook return type
// ---------------------------------------------------------------------------

export interface UseUndoRedoResult {
  /** Undo the most recent operation */
  undo: () => Promise<HistoryOperation | null>
  /** Redo the most recently undone operation */
  redo: () => Promise<HistoryOperation | null>
  /** Whether undo is available */
  canUndo: boolean
  /** Whether redo is available */
  canRedo: boolean
  /** The undo stack for display */
  undoStack: readonly HistoryOperation[]
  /** The redo stack for display */
  redoStack: readonly HistoryOperation[]
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useUndoRedo(): UseUndoRedoResult {
  const [canUndo, setCanUndo] = useState(historyManager.canUndo())
  const [canRedo, setCanRedo] = useState(historyManager.canRedo())
  const [undoStack, setUndoStack] = useState<readonly HistoryOperation[]>(
    historyManager.getUndoStack(),
  )
  const [redoStack, setRedoStack] = useState<readonly HistoryOperation[]>(
    historyManager.getRedoStack(),
  )

  // Subscribe to history changes
  useEffect(() => {
    const unsubscribe = historyManager.subscribe(() => {
      setCanUndo(historyManager.canUndo())
      setCanRedo(historyManager.canRedo())
      setUndoStack(historyManager.getUndoStack())
      setRedoStack(historyManager.getRedoStack())
    })

    return unsubscribe
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Cmd/Ctrl+Z — undo
      // Cmd/Ctrl+Shift+Z — redo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()

        if (e.shiftKey) {
          historyManager.redo()
        } else {
          historyManager.undo()
        }
      }

      // Cmd/Ctrl+y — redo (alternative)
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault()
        historyManager.redo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const undo = useCallback(async () => {
    return historyManager.undo()
  }, [])

  const redo = useCallback(async () => {
    return historyManager.redo()
  }, [])

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    undoStack,
    redoStack,
  }
}
