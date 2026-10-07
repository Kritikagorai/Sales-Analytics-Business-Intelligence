'use client'

import { Download, FileSpreadsheet } from 'lucide-react'
import { RequireData } from '@/components/require-data'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ANALYSES, buildLossReport } from '@/lib/sales/analyses'
import { downloadCsv, downloadTable } from '@/lib/sales/csv'
import type { Dataset, FieldKey, SalesRow } from '@/lib/sales/types'
import { runAnalysis, useAnalysisContext } from '@/lib/sales/use-analysis'

const toIso = (d: Date | null) =>
  d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : ''

function Downloads({ dataset, rows }: { dataset: Dataset; rows: SalesRow[] }) {
  const ctx = useAnalysisContext(dataset)
  const has = (f: FieldKey) => Boolean(dataset.mapping[f])

  const cleanedRows = () =>
    downloadCsv(
      'cleaned_sales.csv',
      rows.map((r) => ({ ...r, date: toIso(r.date) })),
    )

  return (
    <div className="flex flex-col gap-3">
      <Card size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="size-4" aria-hidden="true" />
            Cleaned sales data
          </CardTitle>
          <CardDescription>All {rows.length.toLocaleString()} rows with the columns you confirmed.</CardDescription>
          <CardAction>
            <Button size="sm" onClick={cleanedRows}>
              <Download />
              CSV
            </Button>
          </CardAction>
        </CardHeader>
      </Card>

      {ANALYSES.map((def) => {
        const unavailable = def.requires.some((f) => !has(f))
        return (
          <Card key={def.id} size="sm">
            <CardHeader>
              <CardTitle>{def.title}</CardTitle>
              <CardDescription>{unavailable ? 'Not available for your file.' : def.question}</CardDescription>
              <CardAction>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={unavailable}
                  onClick={() => {
                    const { result } = runAnalysis(def, rows, ctx)
                    if (result) downloadTable(`${def.id}.csv`, result.table)
                  }}
                >
                  <Download />
                  CSV
                </Button>
              </CardAction>
            </CardHeader>
          </Card>
        )
      })}

      <Card size="sm">
        <CardHeader>
          <CardTitle>Loss report</CardTitle>
          <CardDescription>
            {has('profit') && has('product') ? 'Loss-making products with reasons and actions.' : 'Not available for your file.'}
          </CardDescription>
          <CardAction>
            <Button
              size="sm"
              variant="outline"
              disabled={!has('profit') || !has('product')}
              onClick={() =>
                downloadCsv(
                  'loss_report.csv',
                  buildLossReport(rows, has).map((i) => ({
                    Product: i.name,
                    Sales: i.sales.toFixed(2),
                    Profit: i.profit.toFixed(2),
                    Orders: i.orders,
                    Why: i.reason,
                    'What to do': i.action,
                  })),
                )
              }
            >
              <Download />
              CSV
            </Button>
          </CardAction>
        </CardHeader>
      </Card>
    </div>
  )
}

export function DownloadCenter() {
  return (
    <RequireData>
      {({ dataset, rows }) => (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">Download</h1>
            <p className="text-muted-foreground">Save any result as a CSV file to open in Excel or Google Sheets.</p>
          </div>
          <Downloads dataset={dataset} rows={rows} />
        </div>
      )}
    </RequireData>
  )
}
