'use client'

import { type ReactNode } from 'react'
import { Card, Flex, Grid, Text } from '@tremor/react'
import { PageHeader } from '@/components/pulse/layout/page-header'

interface PulsePageProps {
  /** Page title displayed in the header */
  title: string
  /** Optional description below the title */
  description?: string
  /** Action buttons rendered in the header right side */
  actions?: ReactNode
  /** Main content area */
  children?: ReactNode
  /** Optional footer (e.g. pagination) */
  footer?: ReactNode
  /** Wrap content in Tremor Card? Default: true */
  card?: boolean
}

/**
 * PulsePage — A standard page template.
 *
 * Layout:
 * - PageHeader (Title + Description + Action buttons)
 * - Content area with optional Tremor Card wrapper
 * - Optional footer with pagination
 */
export function PulsePage({
  title,
  description,
  actions,
  children,
  footer,
  card = true,
}: PulsePageProps) {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <PageHeader title={title} description={description} actions={actions} />

      {/* Content */}
      {card ? (
        <Card>
          <div className="p-1">{children}</div>
        </Card>
      ) : (
        <div>{children}</div>
      )}

      {/* Footer */}
      {footer && (
        <Flex justifyContent="between" alignItems="center" className="pt-2">
          {footer}
        </Flex>
      )}
    </div>
  )
}
