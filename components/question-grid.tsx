import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { ANALYSES } from '@/lib/sales/analyses'

export function QuestionGrid() {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {ANALYSES.map((a, i) => (
        <li key={a.id}>
          <Link
            href={`/dashboard?a=${a.id}`}
            className="group flex h-full items-start gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-semibold text-secondary-foreground tabular-nums">
              {i + 1}
            </span>
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{a.title}</span>
              <span className="font-medium">{a.question}</span>
            </span>
            <ArrowRight
              className="mt-1 size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </li>
      ))}
    </ul>
  )
}
