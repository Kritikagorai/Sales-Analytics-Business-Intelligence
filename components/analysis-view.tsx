'use client'

import { Download, Info } from 'lucide-react'
import { ChartCard } from '@/components/chart-card'
import { DataTable } from '@/components/data-table'
import { KpiCard } from '@/components/kpi-card'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AnalysisDef, AnalysisResult } from '@/lib/sales/analyses'
import { downloadTable } from '@/lib/sales/csv'
import { FIELD_LABELS, type Currency, type FieldKey } from '@/lib/sales/types'

type Props = {
  def: AnalysisDef
  result: AnalysisResult | null
  missing: FieldKey[]
  currency: Currency | null
}

export function AnalysisView({ def, result, missing, currency }: Props) {
  if (missing.length || !result) {
    return (
      <Card>
        <CardContent className="flex items-start gap-3 py-2">
          <Info className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div>
            <p className="font-medium">We cannot answer this from your file.</p>
            <p className="text-sm text-muted-foreground">
              Your file needs a {missing.map((m) => FIELD_LABELS[m].toLowerCase()).join(' and ')} column. You can pick
              it on the Check your file page.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const twoUp = result.charts.length > 1

  return (
    <div className="flex flex-col gap-4">
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle>In simple words</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed">
            {result.summary.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {result.kpis && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {result.kpis.map((k) => (
            <KpiCard key={k.label} {...k} />
          ))}
        </div>
      )}

      <div className={twoUp ? 'grid gap-4 xl:grid-cols-2' : 'flex flex-col gap-4'}>
        {result.charts.map((chart) => (
          <ChartCard key={chart.title} spec={chart} currency={currency} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardAction>
            <Button variant="outline" size="sm" onClick={() => downloadTable(`${def.id}.csv`, result.table)}>
              <Download />
              Download CSV
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <DataTable table={result.table} currency={currency} />
        </CardContent>
      </Card>
    </div>
  )
}
