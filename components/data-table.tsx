import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { TableSpec } from '@/lib/sales/analyses'
import { formatMoney, formatNumber, formatPercent } from '@/lib/sales/format'
import type { Currency } from '@/lib/sales/types'
import { cn } from '@/lib/utils'

type Props = { table: TableSpec; currency: Currency | null; limit?: number }

export function DataTable({ table, currency, limit = 15 }: Props) {
  const rows = table.rows.slice(0, limit)

  if (!rows.length) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No rows match these filters.</p>
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {table.columns.map((c) => (
              <TableHead key={c.key} className={cn(c.kind !== 'text' && 'text-right')}>
                {c.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={`${row.name}-${i}`}>
              {table.columns.map((c) => {
                const value = row[c.key]
                const num = Number(value)
                let text = String(value ?? '')
                if (c.kind === 'money') text = formatMoney(num, currency, false)
                if (c.kind === 'number') text = formatNumber(num)
                if (c.kind === 'percent') text = formatPercent(num)
                return (
                  <TableCell
                    key={c.key}
                    className={cn(
                      c.kind === 'text' ? 'max-w-64 truncate font-medium' : 'text-right tabular-nums',
                      c.key === 'profit' && num < 0 && 'text-destructive',
                    )}
                  >
                    {text}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {table.rows.length > limit && (
        <p className="pt-3 text-xs text-muted-foreground">
          Showing {limit} of {table.rows.length} rows. Download the CSV to see all.
        </p>
      )}
    </div>
  )
}
