'use client'

import { MessageSquareText } from 'lucide-react'
import { useState } from 'react'
import { AnalysisView } from '@/components/analysis-view'
import { AskBox } from '@/components/ask-box'
import { RequireData } from '@/components/require-data'
import { ANALYSES, matchQuestion } from '@/lib/sales/analyses'
import { runAnalysis, useAnalysisContext } from '@/lib/sales/use-analysis'
import type { Dataset, SalesRow } from '@/lib/sales/types'

type Entry = { id: number; question: string; analysisId: string | null }

function Conversation({
  dataset,
  rows,
  initialQuestion,
}: {
  dataset: Dataset
  rows: SalesRow[]
  initialQuestion: string | null
}) {
  const ctx = useAnalysisContext(dataset)
  const [history, setHistory] = useState<Entry[]>(() =>
    initialQuestion ? [{ id: 1, question: initialQuestion, analysisId: matchQuestion(initialQuestion)?.id ?? null }] : [],
  )

  const ask = (question: string) =>
    setHistory((h) => [{ id: Date.now(), question, analysisId: matchQuestion(question)?.id ?? null }, ...h])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Ask Anything</h1>
        <p className="text-muted-foreground">Type a question in English or Hinglish.</p>
      </div>

      <AskBox onAsk={ask} autoFocus />

      <div className="flex flex-wrap gap-2">
        {ANALYSES.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => ask(a.question)}
            className="rounded-full border bg-card px-3 py-1.5 text-sm transition-colors hover:bg-muted"
          >
            {a.question}
          </button>
        ))}
      </div>

      {history.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          <MessageSquareText className="size-6" aria-hidden="true" />
          <p>Your answers will show here.</p>
        </div>
      )}

      <ol className="flex flex-col gap-8">
        {history.map((entry) => {
          const def = ANALYSES.find((a) => a.id === entry.analysisId)
          return (
            <li key={entry.id} className="flex flex-col gap-3">
              <p className="self-end rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-sm text-primary-foreground">
                {entry.question}
              </p>
              {def ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Answering: <span className="font-medium text-foreground">{def.question}</span>
                  </p>
                  <AnalysisView def={def} currency={dataset.currency} {...runAnalysis(def, rows, ctx)} />
                </>
              ) : (
                <p className="rounded-xl border bg-card p-4 text-sm">
                  Sorry, we did not understand this question. Try one of the questions above, or use words like
                  sales, profit, region, product, customer or month.
                </p>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export function AskAnything({ initialQuestion }: { initialQuestion: string | null }) {
  return (
    <RequireData>
      {({ dataset, rows }) => <Conversation dataset={dataset} rows={rows} initialQuestion={initialQuestion} />}
    </RequireData>
  )
}
