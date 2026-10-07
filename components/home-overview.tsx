'use client'

import { KpiCard } from '@/components/kpi-card'
import { AskBox } from '@/components/ask-box'
import { QuestionGrid } from '@/components/question-grid'
import { RequireData } from '@/components/require-data'
import type { Kpi } from '@/lib/sales/analyses'
import { countCustomers, countOrders, sum } from '@/lib/sales/compute'
import { formatMoney, formatPercent } from '@/lib/sales/format'
import type { Dataset, SalesRow } from '@/lib/sales/types'

function buildKpis(dataset: Dataset, rows: SalesRow[]): Kpi[] {
  const c = dataset.currency
  const sales = sum(rows, 'sales')
  const profit = sum(rows, 'profit')
  const orders = countOrders(rows)
  const kpis: Kpi[] = [{ label: 'Total sales', value: formatMoney(sales, c), hint: 'All money earned from sales.' }]
  if (dataset.mapping.profit) {
    kpis.push({
      label: 'Total profit',
      value: formatMoney(profit, c),
      hint: 'Money left after costs.',
      tone: profit >= 0 ? 'profit' : 'loss',
    })
  }
  kpis.push({ label: 'Orders', value: orders.toLocaleString(), hint: 'Number of separate orders.' })
  if (dataset.mapping.customer) {
    kpis.push({ label: 'Customers', value: countCustomers(rows).toLocaleString(), hint: 'Different people who bought.' })
  }
  if (dataset.mapping.profit) {
    kpis.push({
      label: 'Profit margin',
      value: formatPercent(sales ? profit / sales : 0),
      hint: 'Profit kept from every sale.',
      tone: profit >= 0 ? 'profit' : 'loss',
    })
  }
  kpis.push({
    label: 'Average order value',
    value: formatMoney(orders ? sales / orders : 0, c),
    hint: 'How much one order is worth.',
  })
  return kpis
}

export function HomeOverview() {
  return (
    <RequireData>
      {({ dataset, rows }) => (
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">Your sales at a glance</h1>
            <p className="text-muted-foreground">From {dataset.fileName}</p>
          </div>

          <section aria-labelledby="kpi-heading" className="flex flex-col gap-3">
            <h2 id="kpi-heading" className="sr-only">
              Key numbers
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {buildKpis(dataset, rows).map((k) => (
                <KpiCard key={k.label} {...k} />
              ))}
            </div>
          </section>

          <section aria-labelledby="ask-heading" className="flex flex-col gap-3">
            <h2 id="ask-heading" className="text-lg font-semibold">
              Ask a question
            </h2>
            <AskBox />
          </section>

          <section aria-labelledby="questions-heading" className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <h2 id="questions-heading" className="text-lg font-semibold">
                Questions we can answer
              </h2>
              <p className="text-sm text-muted-foreground">Click any question to open it in the dashboard.</p>
            </div>
            <QuestionGrid />
          </section>
        </div>
      )}
    </RequireData>
  )
}
