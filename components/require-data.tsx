'use client'

import { FileUp } from 'lucide-react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useSalesRows } from '@/lib/sales/store'
import type { Dataset, SalesRow } from '@/lib/sales/types'

type Props = {
  children: (data: { dataset: Dataset; rows: SalesRow[] }) => React.ReactNode
}

export function RequireData({ children }: Props) {
  const { dataset, rows } = useSalesRows()

  if (dataset === undefined) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-72" />
      </div>
    )
  }

  if (!dataset || !dataset.confirmed) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-xl border border-dashed p-10 text-center">
        <FileUp className="size-8 text-muted-foreground" aria-hidden="true" />
        <h1 className="text-lg font-semibold text-balance">Please upload your sales file first.</h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Your results will show here after you upload and check your file.
        </p>
        <Link href={dataset ? '/check' : '/'} className={buttonVariants()}>
          {dataset ? 'Check your file' : 'Upload your sales file'}
        </Link>
      </div>
    )
  }

  return <>{children({ dataset, rows })}</>
}
