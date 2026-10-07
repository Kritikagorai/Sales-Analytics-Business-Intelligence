'use client'

import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EMPTY_FILTERS, type Filters } from '@/lib/sales/types'

type Option = { key: 'region' | 'category' | 'segment'; label: string; values: string[] }

type Props = {
  filters: Filters
  onChange: (next: Filters) => void
  options: Option[]
  hasDate: boolean
  minDate?: string
  maxDate?: string
}

export function FilterPanel({ filters, onChange, options, hasDate, minDate, maxDate }: Props) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch })
  const active = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS)

  return (
    <div className="flex flex-col gap-4">
      {hasDate && (
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="from">From</Label>
            <Input
              id="from"
              type="date"
              value={filters.from}
              min={minDate}
              max={maxDate}
              onChange={(e) => set({ from: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              type="date"
              value={filters.to}
              min={minDate}
              max={maxDate}
              onChange={(e) => set({ to: e.target.value })}
            />
          </div>
        </div>
      )}

      {options
        .filter((o) => o.values.length > 1)
        .map((o) => {
          const items = [{ value: 'all', label: `All ${o.label.toLowerCase()}s` }, ...o.values.map((v) => ({ value: v, label: v }))]
          return (
            <div key={o.key} className="flex flex-col gap-1.5">
              <Label>{o.label}</Label>
              <Select items={items} value={filters[o.key]} onValueChange={(v) => set({ [o.key]: String(v ?? 'all') })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        })}

      {active && (
        <Button variant="ghost" size="sm" onClick={() => onChange(EMPTY_FILTERS)} className="self-start">
          <RotateCcw />
          Clear filters
        </Button>
      )}
    </div>
  )
}
