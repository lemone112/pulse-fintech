'use client'

import { Component, type ReactNode } from 'react'
import { Card, Flex, Text, Button, Callout, Icon } from '@tremor/react'
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * React error boundary class component.
 * Catches runtime errors in its children and displays a friendly
 * Russian error message with a "Попробовать снова" button and
 * collapsible error details. Styled with Tremor Card + Callout.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console (or Sentry when configured)
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset)
      }
      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />
    }
    return this.props.children
  }
}

/** Default error fallback UI — Tremor Card + Callout, friendly Russian message */
export function ErrorFallback({ error, onReset }: { error: Error; onReset: () => void }) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <Card className="max-w-lg w-full">
        <Flex flexDirection="col" className="gap-4">
          <Callout
            title="Что-то пошло не так"
            icon={AlertTriangle}
            color="rose"
          >
            Произошла непредвиденная ошибка. Попробуйте обновить страницу или повторить действие позже.
          </Callout>

          <Flex justifyContent="center" className="gap-3 mt-2">
            <Button
              variant="primary"
              size="sm"
              icon={RefreshCw}
              onClick={onReset}
            >
              Попробовать снова
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Обновить страницу
            </Button>
          </Flex>

          {/* Collapsible error details */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-xs text-tremor-content-subtle hover:text-tremor-content transition-colors mt-2"
          >
            {showDetails ? (
              <Icon icon={ChevronUp} className="h-3 w-3" />
            ) : (
              <Icon icon={ChevronDown} className="h-3 w-3" />
            )}
            <span>Детали ошибки</span>
          </button>

          {showDetails && (
            <pre className="bg-tremor-background-muted rounded-lg p-3 text-xs text-tremor-content-subtle overflow-auto max-h-40 custom-scrollbar">
              <code>{error.message}{'\n\n'}{error.stack}</code>
            </pre>
          )}
        </Flex>
      </Card>
    </div>
  )
}
