'use client'

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type { ChartSpec } from '@/lib/sales/analyses'
import { formatMoney, formatNumber } from '@/lib/sales/format'
import type { Currency } from '@/lib/sales/types'

const PALETTE = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']

const baseConfig = {
  sales: { label: 'Sales', color: 'var(--chart-1)' },
  profit: { label: 'Profit', color: 'var(--profit)' },
} satisfies ChartConfig

const shorten = (value: string, max = 18) => (value.length > max ? `${value.slice(0, max - 1)}…` : value)

type Props = { spec: ChartSpec; currency: Currency | null }

export function ChartCard({ spec, currency }: Props) {
  const money = (v: number) => formatMoney(Number(v), currency)

  const tooltip = (isMoney = true) => (
    <ChartTooltip
      cursor={false}
      content={
        <ChartTooltipContent
          formatter={(value, name, item) => (
            <div className="flex w-full items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span
                  className="size-2.5 rounded-[2px]"
                  style={{ background: (item?.payload?.fill as string) ?? item?.color }}
                  aria-hidden="true"
                />
                {String(baseConfig[name as keyof typeof baseConfig]?.label ?? name)}
              </span>
              <span className="font-mono font-medium tabular-nums text-foreground">
                {isMoney ? money(Number(value)) : formatNumber(Number(value))}
              </span>
            </div>
          )}
        />
      }
    />
  )

  let body: React.ReactNode = null

  if (spec.type === 'donut') {
    const config: ChartConfig = Object.fromEntries(
      spec.data.map((d, i) => [d.name, { label: d.name, color: PALETTE[i % PALETTE.length] }]),
    )
    const isCount = spec.title.toLowerCase().includes('customers')
    body = (
      <ChartContainer config={config} className="mx-auto aspect-square h-64">
        <PieChart>
          {tooltip(!isCount)}
          <Pie data={spec.data} dataKey="value" nameKey="name" innerRadius={58} strokeWidth={2}>
            {spec.data.map((d, i) => (
              <Cell key={d.name} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <ChartLegend content={<ChartLegendContent nameKey="name" />} className="flex-wrap" />
        </PieChart>
      </ChartContainer>
    )
  } else if (spec.type === 'signed-bar') {
    const horizontal = spec.data.some((d) => String(d[spec.xKey]).length > 10) || spec.data.length > 14
    const height = horizontal ? Math.max(260, spec.data.length * 30) : 288
    body = (
      <ChartContainer config={baseConfig} className="aspect-auto w-full" style={{ height }}>
        <BarChart data={spec.data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ left: 4, right: 12 }}>
          <CartesianGrid vertical={horizontal} horizontal={!horizontal} />
          {horizontal ? (
            <>
              <XAxis type="number" tickFormatter={money} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey={spec.xKey}
                width={140}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => shorten(String(v))}
              />
            </>
          ) : (
            <>
              <XAxis dataKey={spec.xKey} tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} />
              <YAxis tickFormatter={money} tickLine={false} axisLine={false} width={64} />
            </>
          )}
          {tooltip()}
          <Bar dataKey={spec.valueKey} radius={4}>
            {spec.data.map((d) => (
              <Cell
                key={String(d[spec.xKey])}
                fill={Number(d[spec.valueKey]) >= 0 ? 'var(--profit)' : 'var(--destructive)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    )
  } else if (spec.type === 'line') {
    body = (
      <ChartContainer config={baseConfig} className="aspect-auto h-72 w-full">
        <LineChart data={spec.data} margin={{ left: 4, right: 12 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey={spec.xKey} tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
          <YAxis tickFormatter={money} tickLine={false} axisLine={false} width={64} />
          {tooltip()}
          {spec.series.length > 1 && <ChartLegend content={<ChartLegendContent />} />}
          {spec.series.map((s) => (
            <Line key={s.key} dataKey={s.key} stroke={s.color} strokeWidth={2} dot={false} type="monotone" />
          ))}
        </LineChart>
      </ChartContainer>
    )
  } else {
    const horizontal = Boolean(spec.horizontal)
    const height = horizontal ? Math.max(260, spec.data.length * 32) : 288
    body = (
      <ChartContainer config={baseConfig} className="aspect-auto w-full" style={{ height }}>
        <BarChart data={spec.data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ left: 4, right: 12 }}>
          <CartesianGrid vertical={horizontal} horizontal={!horizontal} />
          {horizontal ? (
            <>
              <XAxis type="number" tickFormatter={money} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey={spec.xKey}
                width={140}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => shorten(String(v))}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey={spec.xKey}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(v) => shorten(String(v), 12)}
              />
              <YAxis tickFormatter={money} tickLine={false} axisLine={false} width={64} />
            </>
          )}
          {tooltip()}
          {spec.series.length > 1 && <ChartLegend content={<ChartLegendContent />} />}
          {spec.series.map((s) => (
            <Bar key={s.key} dataKey={s.key} fill={s.color} radius={4} />
          ))}
        </BarChart>
      </ChartContainer>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{spec.title}</CardTitle>
        <CardDescription>{spec.caption}</CardDescription>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  )
}
