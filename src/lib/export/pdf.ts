// ============================================================================
// PULSE Export — PDF Export
// ============================================================================
// Export report to PDF using server-side HTML-to-PDF approach.

export interface PDFExportOptions {
  title: string
  subtitle?: string
  organizationName?: string
  period?: string
  data: Array<Record<string, unknown>>
  columns: Array<{ key: string; label: string; align?: 'left' | 'right' | 'center' }>
  totals?: Record<string, number | string>
}

/**
 * Generate HTML content for PDF export.
 * This HTML is then rendered to PDF using a headless browser or wkhtmltopdf.
 */
export function generatePDFHtml(options: PDFExportOptions): string {
  const { title, subtitle, organizationName, period, data, columns, totals } = options

  const tableHeaders = columns
    .map((col) => `<th style="text-align:${col.align || 'left'}; padding:8px 12px; border-bottom:2px solid #e5e7eb; font-size:13px; color:#6b7280;">${col.label}</th>`)
    .join('')

  const tableRows = data
    .map((row) => {
      const cells = columns
        .map((col) => {
          const value = row[col.key]
          const formatted = typeof value === 'number' ? value.toLocaleString('ru-RU') : String(value ?? '')
          return `<td style="text-align:${col.align || 'left'}; padding:8px 12px; border-bottom:1px solid #f3f4f6; font-size:13px;">${formatted}</td>`
        })
        .join('')
      return `<tr>${cells}</tr>`
    })
    .join('')

  const totalsRow = totals
    ? `<tr style="font-weight:bold; background:#f9fafb;">
        ${columns
          .map((col) => {
            const value = totals[col.key]
            const formatted = value !== undefined
              ? typeof value === 'number'
                ? value.toLocaleString('ru-RU')
                : String(value)
              : ''
            return `<td style="text-align:${col.align || 'left'}; padding:8px 12px; border-top:2px solid #e5e7eb; font-size:13px;">${formatted}</td>`
          })
          .join('')}
      </tr>`
    : ''

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111827; padding: 40px; }
    .header { margin-bottom: 32px; }
    .header h1 { font-size: 24px; font-weight: 600; color: #111827; }
    .header p { font-size: 14px; color: #6b7280; margin-top: 4px; }
    .org-name { font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    .footer { margin-top: 32px; font-size: 11px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="header">
    ${organizationName ? `<div class="org-name">${organizationName}</div>` : ''}
    <h1>${title}</h1>
    ${subtitle ? `<p>${subtitle}</p>` : ''}
    ${period ? `<p>Период: ${period}</p>` : ''}
  </div>

  <table>
    <thead><tr>${tableHeaders}</tr></thead>
    <tbody>${tableRows}${totalsRow}</tbody>
  </table>

  <div class="footer">
    Сформировано: ${new Date().toLocaleString('ru-RU')} | PULSE Fintech
  </div>
</body>
</html>`
}

/**
 * Export data as PDF.
 * Returns the HTML content with PDF content-type header.
 * In production, this would use Puppeteer or wkhtmltopdf to generate actual PDF.
 */
export function exportToPDF(options: PDFExportOptions): { html: string; filename: string } {
  const filename = `${options.title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`
  const html = generatePDFHtml(options)

  return { html, filename }
}
