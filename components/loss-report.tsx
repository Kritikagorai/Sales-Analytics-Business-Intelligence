'use client'

import { Lightbulb, TrendingDown } from 'lucide-react'
import { RequireData } from '@/components/require-data'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { buildLossReport } from '@/lib/sales/analyses'
import { groupBy, sum } from '@/lib/sales/compute'
import { formatMoney, formatPercent } from '@/lib/sales/format'
import type { Dataset, FieldKey, SalesRow } from '@/lib/sales/types'

function businessSummary(dataset: Dataset, rows: SalesRow[]): string[] {
  const c = dataset.currency
  const sales = sum(rows, 'sales')
  const profit = sum(rows, 'profit')
  const lines = [
    profit >= 0
      ? `Overall you made ${formatMoney(profit, c)} profit on ${formatMoney(sales, c)} of sales.`
      : `Overall you lost ${formatMoney(Math.abs(profit), c)} on ${formatMoney(sales, c)} of sales.`,
  ]
  const products = groupBy(rows, (r) => r.product)
  const losing = products.filter((p) => p.profit < 0)
  const lossTotal = losing.reduce((a, p) => a + p.profit, 0)
  if (products.length) {
    lines.push(`${losing.length} of ${products.length} products lost money, ${formatMoney(Math.abs(lossTotal), c)} in total.`)
  }
  if (dataset.mapping.category) {
    const cats = groupBy(rows, (r) => r.category).sort((a, b) => a.profit - b.profit)
    if (cats[0]) lines.push(`"${cats[0].name}" is the weakest category (${formatMoney(cats[0].profit, c)} profit).`)
  }
  if (dataset.mapping.region) {
    const regions = groupBy(rows, (r) => r.region).sort((a, b) => a.profit - b.profit)
    if (regions[0]) lines.push(`"${regions[0].name}" is the weakest region (${formatMoney(regions[0].profit, c)} profit).`)
  }
  if (dataset.mapping.discount) {
    const high = rows.filter((r) => (r.discount ?? 0) >= 0.3)
    const highLoss = high.filter((r) => (r.profit ?? 0) < 0).length
    if (high.length) {
      lines.push(`${formatPercent(highLoss / high.length)} of sales with 30%+ discount ended in a loss.`)
    }
  }
  return lines
}

function Report({ dataset, rows }: { dataset: Dataset; rows: SalesRow[] }) {
  const has = (f: FieldKey) => Boolean(dataset.mapping[f])

  if (!has('profit') || !has('product')) {
    return (
      <Card>
        <CardContent className="py-2">
          <p className="font-medium">We need a profit and a product column to make the loss report.</p>
          <p className="text-sm text-muted-foreground">You can choose them on the Check your file page.</p>
        </CardContent>
      </Card>
    )
  }

  const items = buildLossReport(rows, has)
  const c = dataset.currency

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle>Business summary</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed">
            {businessSummary(dataset, rows).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Products losing money</h2>
        <p className="text-sm text-muted-foreground">Biggest losses first. Showing up to 24 products.</p>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border bg-card p-6 text-center text-sm">Good news: no product is losing money.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <li key={item.name}>
              <Card className="h-full border-t-4 border-t-destructive">
                <CardHeader>
                  <CardTitle className="line-clamp-2">{item.name}</CardTitle>
                  <CardDescription className="flex flex-wrap gap-2">
                    <span>Sales {formatMoney(item.sales, c)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.orders} orders</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="size-4 text-destructive" aria-hidden="true" />
                    <span className="text-xl font-semibold text-destructive tabular-nums">
                      {formatMoney(item.profit, c)}
                    </span>
                    {item.avgDiscount != null && (
                      <Badge variant="outline">{formatPercent(item.avgDiscount)} avg discount</Badge>
                    )}
                  </div>
                  <p className="text-sm">
                    <span className="font-medium">Why: </span>
                    {item.reason}
                  </p>
                  <p className="flex gap-2 rounded-lg bg-muted p-3 text-sm">
                    <Lightbulb className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <span>
                      <span className="font-medium">What to do: </span>
                      {item.action}
                    </span>
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function LossReport() {
  return (
    <RequireData>
      {({ dataset, rows }) => (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">Loss Report</h1>
            <p className="text-muted-foreground">Where you are losing money, why, and what to do next.</p>
          </div>
          <Report dataset={dataset} rows={rows} />
        </div>
      )}
    </RequireData>
  )
}
