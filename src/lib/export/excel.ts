// ============================================================================
// PULSE Export — Excel (XLSX) Export
// ============================================================================
// Export data to Excel format.
// Uses a simple XML-based XLSX generation approach (Office Open XML).

export interface ExcelExportOptions {
  title: string
  data: Array<Record<string, unknown>>
  columns: Array<{ key: string; label: string }>
  sheetName?: string
}

/**
 * Generate a simple XLSX file from tabular data.
 * Uses Office Open XML spreadsheet format.
 */
export function exportToExcel(options: ExcelExportOptions): { buffer: Buffer; filename: string } {
  const { title, data, columns, sheetName } = options
  const sheet = sheetName || title.slice(0, 31) // Excel sheet name max 31 chars

  // Build XML content for XLSX
  const headerRow = columns.map((col) => escapeXml(col.label)).join('')
  const dataRows = data.map((row) =>
    columns.map((col) => escapeXml(String(row[col.key] ?? ''))).join('')
  ).join('\n')

  // Simple XLSX using SpreadsheetML (can be opened by Excel)
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Font ss:FontName="Calibri" ss:Size="11"/>
   <Alignment ss:Vertical="Bottom"/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1"/>
   <Interior ss:Color="#F3F4F6" ss:Pattern="Solid"/>
   <Alignment ss:Vertical="Center" ss:Horizontal="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="${escapeXml(sheet)}">
  <Table>
   <Row ss:StyleID="Header">
    ${columns.map(() => '<Cell><Data ss:Type="String"></Data></Cell>').join('')}
   </Row>
   <Row ss:StyleID="Header">
    ${headerRow.split(/(?<=<\/Cell>)/).filter(Boolean).map((cell) =>
      `<Cell ss:StyleID="Header"><Data ss:Type="String">${cell.replace(/<Cell>|<\/Cell>|<Data ss:Type="String">|<\/Data>/g, '')}</Data></Cell>`
    ).join('\n    ')}
   </Row>
   ${dataRows.split('\n').map((row) => {
     const cells = row.split(/(?<=<\/Cell>)/).filter(Boolean)
     return `   <Row>\n    ${cells.map((cell) => {
       const value = cell.replace(/<Cell>|<\/Cell>|<Data ss:Type="String">|<\/Data>/g, '')
       const isNumber = !isNaN(Number(value)) && value.trim() !== ''
       return `<Cell><Data ss:Type="${isNumber ? 'Number' : 'String'}">${value}</Data></Cell>`
     }).join('\n    ')}\n   </Row>`
   }).join('\n')}
  </Table>
 </Worksheet>
</Workbook>`

  const buffer = Buffer.from(xml, 'utf-8')
  const filename = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xls`

  return { buffer, filename }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Simpler approach: generate CSV that Excel can open
export function exportToExcelCSV(options: ExcelExportOptions): { csv: string; filename: string } {
  const { title, data, columns } = options

  // BOM for Excel to recognize UTF-8
  const BOM = '\uFEFF'

  const header = columns.map((col) => `"${col.label}"`).join(';')
  const rows = data.map((row) =>
    columns.map((col) => {
      const value = String(row[col.key] ?? '')
      return `"${value.replace(/"/g, '""')}"`
    }).join(';')
  )

  const csv = BOM + [header, ...rows].join('\n')
  const filename = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`

  return { csv, filename }
}
