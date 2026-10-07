'use client'

import { useMemo, useState } from 'react'
import { AnalysisView } from '@/components/analysis-view'
import { FilterPanel } from '@/components/filter-panel'
import { RequireData } from '@/components/require-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ANALYSES, getAnalysis } from '@/lib/sales/analyses'
import { applyFilters, dateRange, uniqueValues } from '@/lib/sales/compute'
import { EMPTY_FILTERS, type Dataset, type Filters, type SalesRow } from '@/lib/sales/types'
import { runAnalysis, useAnalysisContext } from '@/lib/sales/use-analysis'
import { cn } from '@/lib/utils'

const toInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function DashboardInner({ dataset, rows, initialId }: { dataset: Dataset; rows: SalesRow[]; initialId: string }) {
  const [activeId, setActiveId] = useState(initialId)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [granularity, setGranularity] = useState<'month' | 'week'>('month')
  const ctx = useAnalysisContext(dataset, granularity)
  const def = getAnalysis(activeId) ?? ANALYSES[0]

  const options = useMemo(
    () =>
      (['region', 'category', 'segment'] as const)
        .filter((key) => dataset.mapping[key])
        .map((key) => ({
          key,
          label: key === 'segment' ? 'Segment' : key[0].toUpperCase() + key.slice(1),
          values: uniqueValues(rows, key),
        })),
    [dataset.mapping, rows],
  )
  const range = useMemo(() => dateRange(rows), [rows])
  const filtered = useMemo(() => applyFilters(rows, filters), [rows, filters])
  const { missing, result } = useMemo(() => runAnalysis(def, filtered, ctx), [def, filtered, ctx])

  const select = (id: string) => {
    setActiveId(id)
    window.history.replaceState(null, '', `/dashboard?a=${id}`)
  }

  const analysisItems = ANALYSES.map((a) => ({ value: a.id, label: a.question }))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Pick a question and use the filters. Charts update right away.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
          <div className="lg:hidden">
            <Select items={analysisItems} value={def.id} onValueChange={(v) => v && select(String(v))}>
              <SelectTrigger className="w-full" aria-label="Choose a question">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {analysisItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card size="sm" className="hidden lg:flex">
            <CardHeader>
              <CardTitle>Questions</CardTitle>
            </CardHeader>
            <CardContent className="px-2">
              <nav aria-label="Analyses" className="flex flex-col gap-0.5">
                {ANALYSES.map((a, i) => {
                  const active = a.id === def.id
                  const unavailable = a.requires.some((f) => !ctx.has(f))
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => select(a.id)}
                      aria-current={active ? 'true' : undefined}
                      className={cn(
                        'flex items-start gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors',
                        active ? 'bg-secondary font-medium' : 'hover:bg-muted',
                        unavailable && 'opacity-50',
                      )}
                    >
                      <span className="w-4 shrink-0 text-xs text-muted-foreground tabular-nums">{i + 1}</span>
                      <span className="flex flex-col">
                        <span>{a.title}</span>
                        <span className="text-xs font-normal text-muted-foreground">{a.question}</span>
                      </span>
                    </button>
                  )
                })}
              </nav>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <FilterPanel
                filters={filters}
                onChange={setFilters}
                options={options}
                hasDate={Boolean(dataset.mapping.date)}
                minDate={range ? toInput(range.min) : undefined}
                maxDate={range ? toInput(range.max) : undefined}
              />
              <p className="pt-3 text-xs text-muted-foreground tabular-nums">
                {filtered.length.toLocaleString()} of {rows.length.toLocaleString()} rows
              </p>
            </CardContent>
          </Card>
        </aside>

        <section aria-labelledby="analysis-title" className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{def.title}</p>
              <h2 id="analysis-title" className="text-xl font-semibold text-balance">
                {def.question}
              </h2>
            </div>
            {def.id === 'trends' && (
              <Tabs value={granularity} onValueChange={(v) => setGranularity(v as 'month' | 'week')}>
                <TabsList>
                  <TabsTrigger value="month">Monthly</TabsTrigger>
                  <TabsTrigger value="week">Weekly</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>
          <AnalysisView def={def} result={result} missing={missing} currency={dataset.currency} />
        </section>
      </div>
    </div>
  )
}

export function Dashboard({ initialId }: { initialId: string }) {
  return (
    <RequireData>
      {({ dataset, rows }) => <DashboardInner dataset={dataset} rows={rows} initialId={initialId} />}
    </RequireData>
  )
}
