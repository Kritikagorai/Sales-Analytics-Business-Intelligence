import { Card, CardContent } from '@/components/ui/card'
import type { Kpi } from '@/lib/sales/analyses'
import { cn } from '@/lib/utils'

export function KpiCard({ label, value, hint, tone }: Kpi) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p
          className={cn(
            'text-2xl font-semibold tracking-tight tabular-nums',
            tone === 'profit' && 'text-profit',
            tone === 'loss' && 'text-destructive',
          )}
        >
          {value}
        </p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  )
}
