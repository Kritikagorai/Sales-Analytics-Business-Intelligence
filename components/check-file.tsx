'use client'

import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { dateRange } from '@/lib/sales/compute'
import { updateDataset, useSalesRows } from '@/lib/sales/store'
import { type Currency, FIELD_KEYS, FIELD_LABELS, type FieldKey, REQUIRED_FIELDS } from '@/lib/sales/types'

const NONE = '__none__'
const CURRENCIES: { value: Currency; label: string }[] = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'INR', label: 'Indian Rupee (Rs.)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
]

const fmtDate = (d: Date) => d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })

export function CheckFile() {
  const router = useRouter()
  const { dataset, rows } = useSalesRows()

  if (dataset === undefined) return <Skeleton className="h-96" />
  if (!dataset) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="font-medium">Please upload your sales file first.</p>
        <Link href="/" className={buttonVariants()}>
          Upload your sales file
        </Link>
      </div>
    )
  }

  const range = dateRange(rows)
  const missingRequired = REQUIRED_FIELDS.filter((f) => !dataset.mapping[f])
  const canContinue = missingRequired.length === 0 && dataset.currency !== null && rows.length > 0
  const columnItems = [{ value: NONE, label: 'Not in my file' }, ...dataset.headers.map((h) => ({ value: h, label: h }))]

  const setField = (field: FieldKey, value: string) => {
    const mapping = { ...dataset.mapping }
    if (value === NONE) delete mapping[field]
    else mapping[field] = value
    updateDataset({ mapping })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Check your file</h1>
        <p className="text-muted-foreground">
          We read <span className="font-medium text-foreground">{dataset.fileName}</span>. Please check that the
          columns below are correct.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card size="sm">
          <CardContent>
            <p className="text-sm text-muted-foreground">Rows with sales</p>
            <p className="text-2xl font-semibold tabular-nums">{rows.length.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <p className="text-sm text-muted-foreground">Columns found</p>
            <p className="text-2xl font-semibold tabular-nums">{dataset.headers.length}</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <p className="text-sm text-muted-foreground">Date range</p>
            <p className="text-base font-semibold">
              {range ? `${fmtDate(range.min)} – ${fmtDate(range.max)}` : 'No dates found'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Which column is which?</CardTitle>
          <CardDescription>
            We matched these by name. If one is wrong or empty, choose the right column.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {FIELD_KEYS.map((field) => {
            const required = REQUIRED_FIELDS.includes(field)
            const value = dataset.mapping[field] ?? NONE
            return (
              <div key={field} className="flex flex-col gap-1.5">
                <Label className="flex items-center gap-2">
                  {FIELD_LABELS[field]}
                  {required && <Badge variant="secondary">Needed</Badge>}
                  {value !== NONE && <CheckCircle2 className="size-3.5 text-profit" aria-label="Found" />}
                </Label>
                <Select items={columnItems} value={value} onValueChange={(v) => setField(field, String(v ?? NONE))}>
                  <SelectTrigger className="w-full" aria-invalid={required && value === NONE}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {columnItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Currency</CardTitle>
          {dataset.currency === null && (
            <CardDescription className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-4" aria-hidden="true" />
              We could not find the currency in your file. Please choose one.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <Select
            items={CURRENCIES}
            value={dataset.currency}
            onValueChange={(v) => updateDataset({ currency: (v as Currency) ?? null })}
          >
            <SelectTrigger className="w-full sm:w-72">
              <SelectValue placeholder="Choose currency" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {missingRequired.length
            ? `Please choose the ${missingRequired.map((f) => FIELD_LABELS[f].toLowerCase()).join(' and ')} column.`
            : dataset.currency === null
              ? 'Please choose a currency.'
              : 'Everything looks ready.'}
        </p>
        <Button
          size="lg"
          disabled={!canContinue}
          onClick={() => {
            updateDataset({ confirmed: true })
            router.push('/home')
          }}
        >
          Looks good, show my results
        </Button>
      </div>
    </div>
  )
}
