'use client'

import { useEffect } from 'react'
import { Card, Flex, Text, Button, Callout } from '@tremor/react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

/**
 * Next.js error boundary for dashboard routes.
 * Shows a friendly Russian message with Tremor Card + Callout.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[DashboardError]', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <Card className="max-w-lg w-full">
        <Flex flexDirection="col" className="gap-4">
          <Callout
            title="Ошибка загрузки"
            icon={AlertTriangle}
            color="rose"
          >
            Не удалось загрузить данные раздела. Попробуйте ещё раз или обновите страницу.
          </Callout>

          {error.message && (
            <div className="bg-tremor-background-muted rounded-lg p-3 text-xs text-tremor-content-subtle">
              {error.message}
            </div>
          )}

          <Flex justifyContent="end" className="gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Обновить страницу
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={RefreshCw}
              onClick={reset}
            >
              Попробовать снова
            </Button>
          </Flex>
        </Flex>
      </Card>
    </div>
  )
}
