// ============================================================================
// PULSE Export — CSV Export
// ============================================================================

export interface CSVExportOptions {
  title: string
  data: Array<Record<string, unknown>>
  columns: Array<{ key: string; label: string }>
  delimiter?: ',' | ';' | '\t'
}

/**
 * Export data to CSV format.
 * Uses semicolon delimiter by default (Excel Russian locale convention).
 */
export function exportToCSV(options: CSVExportOptions): { csv: string; filename: string } {
  const { title, data, columns, delimiter = ';' } = options

  // BOM for Excel to recognize UTF-8
  const BOM = '\uFEFF'

  const header = columns.map((col) => `"${col.label}"`).join(delimiter)

  const rows = data.map((row) =>
    columns.map((col) => {
      const value = row[col.key]
      if (value === null || value === undefined) return ''
      if (typeof value === 'number') {
        // Use comma as decimal separator for Russian locale
        return `"${value.toLocaleString('ru-RU')}"`
      }
      const strValue = String(value)
      return `"${strValue.replace(/"/g, '""')}"`
    }).join(delimiter)
  )

  const csv = BOM + [header, ...rows].join('\n')
  const filename = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`

  return { csv, filename }
}
