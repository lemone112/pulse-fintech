'use client'

import { Card, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Flex } from '@tremor/react'

/** Table skeleton matching Tremor Table layout */
export function TableSkeleton({
  rows = 6,
  columns = 5,
  showSearch = true,
}: {
  rows?: number
  columns?: number
  showSearch?: boolean
}) {
  return (
    <Card>
      <Flex flexDirection="col" className="gap-4">
        {showSearch && (
          <Flex justifyContent="between" alignItems="center">
            <div className="skeleton-shimmer h-9 w-72 rounded" />
            <div className="skeleton-shimmer h-8 w-20 rounded" />
          </Flex>
        )}

        <Table>
          <TableHead>
            <TableRow>
              {Array.from({ length: columns }).map((_, i) => (
                <TableHeaderCell key={i}>
                  <div className="skeleton-shimmer h-3 w-16 rounded" />
                </TableHeaderCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <TableRow key={rowIdx}>
                {Array.from({ length: columns }).map((_, colIdx) => (
                  <TableCell key={colIdx}>
                    <div
                      className="skeleton-shimmer h-3 rounded"
                      style={{ width: `${40 + ((rowIdx * 7 + colIdx * 13) % 10) * 4}%` }}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Flex>
    </Card>
  )
}
