'use client'

import { type ReactNode } from 'react'
import { Card, Flex, Grid, Text, Title, Tab, TabGroup, TabList, TabPanel, TabPanels } from '@tremor/react'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PulseLayoutProps {
  /** Page title displayed in the header */
  title: string
  /** Optional subtitle / description */
  subtitle?: string
  /** Action buttons rendered in the header right side */
  actions?: ReactNode
  /** Breadcrumb items above the title */
  breadcrumbs?: BreadcrumbItem[]
  /** Tab configuration — renders a tabbed layout */
  tabs?: {
    labels: string[]
    panels: ReactNode[]
  }
  /** Main content (ignored if tabs is provided) */
  children?: ReactNode
}

/**
 * PulseLayout — Reusable page layout template.
 *
 * Uses Tremor Card for the main content area.
 * Hierarchy: Title + Subtitle + Actions header → Optional Breadcrumbs → Optional Tabs → Content slot
 */
export function PulseLayout({
  title,
  subtitle,
  actions,
  breadcrumbs,
  tabs,
  children,
}: PulseLayoutProps) {
  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Flex alignItems="center" className="gap-1 text-sm">
          {breadcrumbs.map((crumb, i) => (
            <Flex key={i} alignItems="center" className="gap-1">
              {i > 0 && (
                <span className="text-tremor-content-subtle">/</span>
              )}
              {crumb.href ? (
                <a
                  href={crumb.href}
                  className="text-tremor-content-subtle hover:text-tremor-content transition-colors"
                >
                  {crumb.label}
                </a>
              ) : (
                <Text className="text-tremor-content">{crumb.label}</Text>
              )}
            </Flex>
          ))}
        </Flex>
      )}

      {/* Header: Title + Subtitle + Actions */}
      <Flex justifyContent="between" alignItems="start">
        <div>
          <Title className="text-tremor-content">{title}</Title>
          {subtitle && (
            <Text className="text-tremor-content-subtle mt-1">{subtitle}</Text>
          )}
        </div>
        {actions && <Flex alignItems="center" className="gap-2">{actions}</Flex>}
      </Flex>

      {/* Content area */}
      {tabs ? (
        <TabGroup>
          <TabList>
            {tabs.labels.map((label) => (
              <Tab key={label}>{label}</Tab>
            ))}
          </TabList>
          <TabPanels>
            {tabs.panels.map((panel, i) => (
              <TabPanel key={i}>{panel}</TabPanel>
            ))}
          </TabPanels>
        </TabGroup>
      ) : (
        <Card>
          <div className="p-1">
            {children}
          </div>
        </Card>
      )}
    </div>
  )
}
