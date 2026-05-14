'use client'

import { useEffect } from 'react'
import { Card, Flex, Text, Button, Callout } from '@tremor/react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

/**
 * Root error boundary — catches errors that bubble up from any route.
 * Must render its own <html> and <body> since the root layout may be broken.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[RootError]', error)
  }, [error])

  return (
    <html lang="ru">
      <body className="bg-tremor-background text-tremor-content antialiased">
        <div className="flex items-center justify-center min-h-screen p-6">
          <Card className="max-w-lg w-full">
            <Flex flexDirection="col" className="gap-4">
              <Callout
                title="Критическая ошибка"
                icon={AlertTriangle}
                color="rose"
              >
                Приложение столкнулось с неожиданной ошибкой. Попробуйте обновить страницу.
              </Callout>

              {error.message && (
                <div className="bg-tremor-background-muted rounded-lg p-3 text-xs text-tremor-content-subtle overflow-auto max-h-32">
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
      </body>
    </html>
  )
}
