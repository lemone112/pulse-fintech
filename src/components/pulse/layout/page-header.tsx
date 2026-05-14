'use client'

import { type ReactNode } from 'react'
import { Flex, Title, Text } from '@tremor/react'

interface PageHeaderProps {
  /** Page title */
  title: string
  /** Optional description below the title */
  description?: string
  /** Action buttons rendered on the right */
  actions?: ReactNode
}

/**
 * PageHeader — Standard page header component.
 *
 * Renders a Title + Description + Action buttons row.
 * Used inside PulsePage or standalone for custom layouts.
 */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <Flex justifyContent="between" alignItems="start">
      <div>
        <Title className="text-tremor-content">{title}</Title>
        {description && (
          <Text className="text-tremor-content-subtle mt-1">{description}</Text>
        )}
      </div>
      {actions && (
        <Flex alignItems="center" className="gap-2 shrink-0">
          {actions}
        </Flex>
      )}
    </Flex>
  )
}
