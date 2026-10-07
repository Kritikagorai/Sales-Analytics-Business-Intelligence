import Papa from 'papaparse'
import type { TableSpec } from './analyses'

export function downloadCsv(fileName: string, rows: Record<string, unknown>[], columns?: string[]) {
  const csv = Papa.unparse(rows, columns ? { columns } : undefined)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

export function downloadTable(fileName: string, table: TableSpec) {
  const rows = table.rows.map((row) =>
    Object.fromEntries(
      table.columns.map((c) => {
        const value = row[c.key]
        const out = typeof value === 'number' ? (c.kind === 'percent' ? (value * 100).toFixed(2) : value.toFixed(2)) : value
        return [c.kind === 'percent' ? `${c.label} (%)` : c.label, out]
      }),
    ),
  )
  downloadCsv(fileName, rows)
}
