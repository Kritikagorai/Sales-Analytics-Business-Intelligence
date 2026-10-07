'use client'

import { useMemo } from 'react'
import type { AnalysisContext, AnalysisDef } from './analyses'
import type { Dataset, FieldKey, SalesRow } from './types'

export function useAnalysisContext(dataset: Dataset, granularity: 'month' | 'week' = 'month'): AnalysisContext {
  return useMemo(
    () => ({
      currency: dataset.currency,
      granularity,
      has: (field: FieldKey) => Boolean(dataset.mapping[field]),
    }),
    [dataset, granularity],
  )
}

export function runAnalysis(def: AnalysisDef, rows: SalesRow[], ctx: AnalysisContext) {
  const missing = def.requires.filter((f) => !ctx.has(f))
  return { missing, result: missing.length ? null : def.run(rows, ctx) }
}
