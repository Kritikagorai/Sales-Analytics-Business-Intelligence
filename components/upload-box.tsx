'use client'

import { Download, FileSpreadsheet, Loader2, Sparkles, UploadCloud } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import Papa from 'papaparse'
import { Button } from '@/components/ui/button'
import { detectCurrency, detectMapping, parseCsvFile } from '@/lib/sales/parse'
import { setDataset } from '@/lib/sales/store'
import type { RawRecord } from '@/lib/sales/types'
import { cn } from '@/lib/utils'

const MAX_BYTES = 50 * 1024 * 1024

export function UploadBox() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please choose a .csv file. In Excel use File > Save As > CSV.')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('This file is bigger than 50 MB. Please upload a smaller file.')
      return
    }
    setBusy(true)
    try {
      const { headers, raw } = await parseCsvFile(file)
      if (!headers.length || !raw.length) {
        setError('This file looks empty. Please check it and try again.')
        return
      }
      const mapping = detectMapping(headers)
      setDataset({
        fileName: file.name,
        headers,
        raw,
        mapping,
        currency: detectCurrency(headers, raw, mapping.sales),
        confirmed: false,
      })
      router.push('/check')
    } catch {
      setError('We could not read this file. Please make sure it is a normal CSV file.')
    } finally {
      setBusy(false)
    }
  }

  const handleSampleData = async (fileName: string = 'sample-sales.csv') => {
    setError(null)
    setBusy(true)
    try {
      const res = await fetch(`/${fileName}`)
      const text = await res.text()
      const parsed = Papa.parse<RawRecord>(text, {
        header: true,
        skipEmptyLines: 'greedy',
        transformHeader: (h) => h.trim(),
      })
      const headers = (parsed.meta.fields ?? []).filter(Boolean)
      const raw = parsed.data
      const mapping = detectMapping(headers)
      setDataset({
        fileName,
        headers,
        raw,
        mapping,
        currency: detectCurrency(headers, raw, mapping.sales),
        confirmed: false,
      })
      router.push('/check')
    } catch {
      setError('Could not load sample data. Please try uploading the file manually.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <label
        htmlFor="sales-file"
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFile(e.dataTransfer.files[0])
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center gap-4 rounded-2xl border-2 border-dashed bg-card px-6 py-12 text-center transition-colors',
          dragging ? 'border-primary bg-muted' : 'border-border hover:border-foreground/30',
        )}
      >
        <span className="flex size-14 items-center justify-center rounded-full bg-muted">
          {busy ? (
            <Loader2 className="size-6 animate-spin" aria-hidden="true" />
          ) : (
            <UploadCloud className="size-6" aria-hidden="true" />
          )}
        </span>
        <span className="flex flex-col gap-1">
          <span className="font-medium">{busy ? 'Reading your file…' : 'Drag and drop your file here'}</span>
          <span className="text-sm text-muted-foreground">CSV file, up to 50 MB</span>
        </span>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button type="button" onClick={() => inputRef.current?.click()} disabled={busy}>
            <FileSpreadsheet className="size-4" />
            Upload your sales file
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={(e) => {
              e.preventDefault()
              handleSampleData('sample-sales.csv')
            }}
            disabled={busy}
          >
            <Sparkles className="size-4 text-amber-500" />
            Try USD format
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={(e) => {
              e.preventDefault()
              handleSampleData('sample-sales-inr-format.csv')
            }}
            disabled={busy}
          >
            <Sparkles className="size-4 text-emerald-500" />
            Try INR format
          </Button>
        </div>
        <input
          ref={inputRef}
          id="sales-file"
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </label>
      <div className="flex flex-col gap-1.5 px-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>Your file stays in this browser tab.</span>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="/sample-sales.csv"
            download="sample-sales.csv"
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            <Download className="size-3.5" />
            USD Sample
          </a>
          <span>•</span>
          <a
            href="/sample-sales-inr-format.csv"
            download="sample-sales-inr-format.csv"
            className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <Download className="size-3.5" />
            INR Sample (DD/MM/YYYY)
          </a>
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
