'use client'

// ============================================================================
// PULSE Fintech — Sync Status Indicator
// ============================================================================
//
// Visual indicator for sync status:
// - 🟢 All synced
// - 🟡 Syncing... (with pending count)
// - 🔴 Offline (with pending count)
// - ⚠️ Conflict (with resolution option)
//
// Uses Tremor Badge component.
// Positioned in the header (DashboardHeader).
// ============================================================================

import { useState, useEffect, useCallback } from 'react'
import { Badge, Flex, Text } from '@tremor/react'
import {
  CheckCircle2,
  Loader2,
  WifiOff,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import type { SyncPhase, SyncStatus } from '@/lib/crdt/types'
import { syncEngine } from '@/lib/sync/engine'
import { backgroundSync } from '@/lib/sync/background'

// ---------------------------------------------------------------------------
// Phase → display config
// ---------------------------------------------------------------------------

const phaseConfig: Record<SyncPhase, {
  icon: typeof CheckCircle2
  color: 'emerald' | 'amber' | 'rose' | 'orange'
  label: string
}> = {
  idle: { icon: CheckCircle2, color: 'emerald', label: 'Синхронизировано' },
  syncing: { icon: Loader2, color: 'amber', label: 'Синхронизация...' },
  offline: { icon: WifiOff, color: 'rose', label: 'Офлайн' },
  conflict: { icon: AlertTriangle, color: 'orange', label: 'Конфликт' },
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SyncIndicator() {
  const [status, setStatus] = useState<SyncStatus>({
    phase: 'idle',
    online: true,
    lastSync: null,
    pendingCount: 0,
    conflictsCount: 0,
  })

  // Subscribe to sync engine status
  useEffect(() => {
    const unsubscribe = syncEngine.onSyncStatusChange(setStatus)
    return unsubscribe
  }, [])

  // Manual sync trigger
  const handleSync = useCallback(async () => {
    await backgroundSync.triggerSync()
  }, [])

  const config = phaseConfig[status.phase]
  const Icon = config.icon
  const isSyncing = status.phase === 'syncing'

  return (
    <Flex alignItems="center" className="gap-2">
      <Badge
        size="sm"
        color={config.color}
        icon={Icon}
        className="cursor-default"
      >
        {config.label}
        {status.pendingCount > 0 && (
          <Text className="ml-1 text-xs">
            ({status.pendingCount} {status.pendingCount === 1 ? 'оп.' : 'оп.'})
          </Text>
        )}
      </Badge>

      {/* Manual sync button — visible when offline or has pending ops */}
      {(status.phase === 'offline' || status.pendingCount > 0) && status.online && (
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="rounded p-1 text-tremor-content-subtle hover:bg-tremor-background-muted hover:text-tremor-content transition-colors disabled:opacity-50"
          title="Синхронизировать"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
        </button>
      )}

      {/* Last sync time */}
      {status.lastSync && status.phase === 'idle' && (
        <Text className="text-xs text-tremor-content-subtle hidden sm:block">
          {formatTimeAgo(status.lastSync)}
        </Text>
      )}
    </Flex>
  )
}

// ---------------------------------------------------------------------------
// Format time ago
// ---------------------------------------------------------------------------

function formatTimeAgo(isoString: string): string {
  const now = Date.now()
  const then = new Date(isoString).getTime()
  const diffMs = now - then

  if (diffMs < 60_000) return 'только что'
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)} мин. назад`
  if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)} ч. назад`
  return `${Math.floor(diffMs / 86_400_000)} дн. назад`
}
