import {
  countCustomers,
  countOrders,
  groupBy,
  monthKey,
  monthLabel,
  monthName,
  sum,
  WEEKDAYS,
  weekKey,
  weekLabel,
} from './compute'
import { formatMoney, formatPercent } from './format'
import type { Currency, FieldKey, SalesRow } from './types'

export type AnalysisId =
  | 'total-sales'
  | 'trends'
  | 'best-products'
  | 'categories'
  | 'regions'
  | 'customers'
  | 'profit-loss'
  | 'seasonal'
  | 'low-performing'

export type Series = { key: string; label: string; color: string }

export type ChartSpec =
  | {
      type: 'line' | 'bar'
      title: string
      caption: string
      data: Record<string, string | number>[]
      xKey: string
      series: Series[]
      horizontal?: boolean
    }
  | {
      type: 'signed-bar'
      title: string
      caption: string
      data: Record<string, string | number>[]
      xKey: string
      valueKey: string
      label: string
    }
  | {
      type: 'donut'
      title: string
      caption: string
      data: { name: string; value: number }[]
    }

export type ColumnKind = 'text' | 'money' | 'number' | 'percent'
export type TableSpec = {
  columns: { key: string; label: string; kind: ColumnKind }[]
  rows: Record<string, string | number>[]
}

export type Kpi = { label: string; value: string; hint: string; tone?: 'profit' | 'loss' }

export type AnalysisResult = {
  summary: string[]
  kpis?: Kpi[]
  charts: ChartSpec[]
  table: TableSpec
}

export type AnalysisContext = {
  currency: Currency | null
  granularity: 'month' | 'week'
  has: (field: FieldKey) => boolean
}

export type AnalysisDef = {
  id: AnalysisId
  title: string
  question: string
  requires: FieldKey[]
  keywords: string[]
  run: (rows: SalesRow[], ctx: AnalysisContext) => AnalysisResult
}

const SALES = 'var(--color-sales)'
const PROFIT = 'var(--color-profit)'

const groupTable = (ctx: AnalysisContext, nameLabel: string) => ({
  columns: [
    { key: 'name', label: nameLabel, kind: 'text' as const },
    { key: 'sales', label: 'Sales', kind: 'money' as const },
    ...(ctx.has('profit')
      ? [
          { key: 'profit', label: 'Profit', kind: 'money' as const },
          { key: 'margin', label: 'Margin', kind: 'percent' as const },
        ]
      : []),
    { key: 'orders', label: 'Orders', kind: 'number' as const },
  ],
})

const toRow = (g: ReturnType<typeof groupBy>[number]) => ({
  name: g.name,
  sales: g.sales,
  profit: g.profit,
  margin: g.sales ? g.profit / g.sales : 0,
  orders: g.orders,
})

const salesSeries = (ctx: AnalysisContext): Series[] => [
  { key: 'sales', label: 'Sales', color: SALES },
  ...(ctx.has('profit') ? [{ key: 'profit', label: 'Profit', color: PROFIT }] : []),
]

const share = (part: number, total: number) => (total ? part / total : 0)

export const ANALYSES: AnalysisDef[] = [
  {
    id: 'total-sales',
    title: 'Total sales',
    question: 'How much did we sell in total?',
    requires: ['sales'],
    keywords: ['total', 'kitna', 'kitni', 'overall', 'revenue', 'kul', 'sum', 'how much'],
    run(rows, ctx) {
      const totalSales = sum(rows, 'sales')
      const totalProfit = sum(rows, 'profit')
      const orders = countOrders(rows)
      const customers = countCustomers(rows)
      const years = groupBy(rows, (r) => (r.date ? String(r.date.getFullYear()) : null)).sort((a, b) =>
        a.name.localeCompare(b.name),
      )
      const kpis: Kpi[] = [
        { label: 'Total sales', value: formatMoney(totalSales, ctx.currency), hint: 'All money earned from sales.' },
        { label: 'Orders', value: orders.toLocaleString(), hint: 'Number of separate orders.' },
        {
          label: 'Average order value',
          value: formatMoney(orders ? totalSales / orders : 0, ctx.currency),
          hint: 'How much one order is worth on average.',
        },
      ]
      if (ctx.has('profit')) {
        kpis.splice(1, 0, {
          label: 'Total profit',
          value: formatMoney(totalProfit, ctx.currency),
          hint: 'Money left after costs.',
          tone: totalProfit >= 0 ? 'profit' : 'loss',
        })
      }
      if (ctx.has('customer')) {
        kpis.push({ label: 'Customers', value: customers.toLocaleString(), hint: 'Different people who bought.' })
      }

      const summary = [`You sold ${formatMoney(totalSales, ctx.currency)} across ${orders.toLocaleString()} orders.`]
      if (years.length > 1) {
        const last = years[years.length - 1]
        const prev = years[years.length - 2]
        const change = share(last.sales - prev.sales, prev.sales)
        summary.push(
          `Sales in ${last.name} were ${formatPercent(Math.abs(change))} ${change >= 0 ? 'higher' : 'lower'} than in ${prev.name}.`,
        )
      }
      return {
        summary,
        kpis,
        charts: [
          {
            type: 'bar',
            title: 'Sales by year',
            caption: 'What this shows: how much you sold in each year.',
            data: years.map(toRow),
            xKey: 'name',
            series: salesSeries(ctx),
          },
        ],
        table: { ...groupTable(ctx, 'Year'), rows: years.map(toRow) },
      }
    },
  },
  {
    id: 'trends',
    title: 'Monthly & weekly trends',
    question: 'How are sales changing over time?',
    requires: ['sales', 'date'],
    keywords: ['trend', 'month', 'monthly', 'week', 'weekly', 'mahine', 'hafte', 'over time', 'growth'],
    run(rows, ctx) {
      const isWeek = ctx.granularity === 'week'
      const groups = groupBy(rows, (r) => (r.date ? (isWeek ? weekKey(r.date) : monthKey(r.date)) : null)).sort(
        (a, b) => a.name.localeCompare(b.name),
      )
      const data = groups.map((g) => ({ ...toRow(g), label: isWeek ? weekLabel(g.name) : monthLabel(g.name) }))
      const best = [...groups].sort((a, b) => b.sales - a.sales)[0]
      const unit = isWeek ? 'week' : 'month'
      const summary: string[] = []
      if (best) {
        summary.push(
          `Your best ${unit} was ${isWeek ? weekLabel(best.name) : monthLabel(best.name)} with ${formatMoney(best.sales, ctx.currency)} in sales.`,
        )
        const avg = sum(rows, 'sales') / groups.length
        summary.push(`On average you sell ${formatMoney(avg, ctx.currency)} per ${unit}.`)
      }
      if (groups.length >= 2) {
        const last = groups[groups.length - 1]
        const prev = groups[groups.length - 2]
        const change = share(last.sales - prev.sales, prev.sales)
        summary.push(
          `The latest ${unit} was ${formatPercent(Math.abs(change))} ${change >= 0 ? 'up' : 'down'} from the one before.`,
        )
      }
      return {
        summary,
        charts: [
          {
            type: 'line',
            title: isWeek ? 'Weekly sales' : 'Monthly sales',
            caption: `What this shows: how sales go up and down each ${unit}.`,
            data,
            xKey: 'label',
            series: salesSeries(ctx),
          },
        ],
        table: {
          ...groupTable(ctx, isWeek ? 'Week starting' : 'Month'),
          rows: data.map(({ label, ...rest }) => ({ ...rest, name: label })),
        },
      }
    },
  },
  {
    id: 'best-products',
    title: 'Best-selling products',
    question: 'Which products sell the most?',
    requires: ['sales', 'product'],
    keywords: ['best', 'top', 'popular', 'sabse zyada', 'bestseller', 'best-selling', 'most sold', 'product'],
    run(rows, ctx) {
      const total = sum(rows, 'sales')
      const top = groupBy(rows, (r) => r.product)
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 10)
      const topShare = share(
        top.reduce((a, g) => a + g.sales, 0),
        total,
      )
      return {
        summary: top[0]
          ? [
              `Your top product is "${top[0].name}" with ${formatMoney(top[0].sales, ctx.currency)} in sales.`,
              `Your top ${top.length} products bring ${formatPercent(topShare)} of all sales.`,
            ]
          : ['No products found for these filters.'],
        charts: [
          {
            type: 'bar',
            title: 'Top 10 products by sales',
            caption: 'What this shows: the products that earned the most money.',
            data: top.map(toRow),
            xKey: 'name',
            series: [{ key: 'sales', label: 'Sales', color: SALES }],
            horizontal: true,
          },
        ],
        table: { ...groupTable(ctx, 'Product'), rows: top.map(toRow) },
      }
    },
  },
  {
    id: 'categories',
    title: 'Product categories',
    question: 'Which categories bring the most sales and profit?',
    requires: ['sales', 'category'],
    keywords: ['category', 'categories', 'type', 'department', 'shreni'],
    run(rows, ctx) {
      const total = sum(rows, 'sales')
      const groups = groupBy(rows, (r) => r.category).sort((a, b) => b.sales - a.sales)
      const charts: ChartSpec[] = []
      if (groups.length > 0 && groups.length < 5) {
        charts.push({
          type: 'donut',
          title: 'Share of sales by category',
          caption: 'What this shows: how big a slice each category takes.',
          data: groups.map((g) => ({ name: g.name, value: g.sales })),
        })
      }
      charts.push({
        type: 'bar',
        title: 'Sales by category',
        caption: 'What this shows: which category earns the most.',
        data: groups.map(toRow),
        xKey: 'name',
        series: salesSeries(ctx),
      })
      const summary = groups[0]
        ? [`"${groups[0].name}" is your biggest category with ${formatPercent(share(groups[0].sales, total))} of sales.`]
        : ['No categories found for these filters.']
      if (ctx.has('profit') && groups.length) {
        const mostProfit = [...groups].sort((a, b) => b.profit - a.profit)[0]
        const leastMargin = [...groups].sort((a, b) => share(a.profit, a.sales) - share(b.profit, b.sales))[0]
        summary.push(`"${mostProfit.name}" makes the most profit (${formatMoney(mostProfit.profit, ctx.currency)}).`)
        if (leastMargin.name !== mostProfit.name) {
          summary.push(
            `"${leastMargin.name}" keeps the least profit per sale (${formatPercent(share(leastMargin.profit, leastMargin.sales))} margin).`,
          )
        }
      }
      return { summary, charts, table: { ...groupTable(ctx, 'Category'), rows: groups.map(toRow) } }
    },
  },
  {
    id: 'regions',
    title: 'Regional performance',
    question: 'Which regions perform best?',
    requires: ['sales', 'region'],
    keywords: ['region', 'regions', 'state', 'city', 'area', 'zone', 'kahan', 'location', 'ilaka'],
    run(rows, ctx) {
      const total = sum(rows, 'sales')
      const groups = groupBy(rows, (r) => r.region).sort((a, b) => b.sales - a.sales)
      const shown = groups.slice(0, 15)
      const summary = groups[0]
        ? [
            `"${groups[0].name}" is your strongest region with ${formatPercent(share(groups[0].sales, total))} of sales.`,
            `"${groups[groups.length - 1].name}" sells the least (${formatMoney(groups[groups.length - 1].sales, ctx.currency)}).`,
          ]
        : ['No regions found for these filters.']
      return {
        summary,
        charts: [
          {
            type: 'bar',
            title: groups.length > 15 ? 'Top 15 regions by sales' : 'Sales by region',
            caption: 'What this shows: how much each region sells.',
            data: shown.map(toRow),
            xKey: 'name',
            series: salesSeries(ctx),
            horizontal: shown.length > 6,
          },
        ],
        table: { ...groupTable(ctx, 'Region'), rows: groups.map(toRow) },
      }
    },
  },
  {
    id: 'customers',
    title: 'Customer behaviour',
    question: 'How do our customers buy?',
    requires: ['sales', 'customer'],
    keywords: ['customer', 'customers', 'buyer', 'grahak', 'repeat', 'loyal', 'client', 'behaviour', 'behavior'],
    run(rows, ctx) {
      const groups = groupBy(rows, (r) => r.customer)
      const totalCustomers = groups.length
      const repeat = groups.filter((g) => g.orders > 1).length
      const totalSales = sum(rows, 'sales')
      const top = [...groups].sort((a, b) => b.sales - a.sales).slice(0, 10)
      const avgSpend = totalCustomers ? totalSales / totalCustomers : 0
      const avgOrders = totalCustomers ? groups.reduce((a, g) => a + g.orders, 0) / totalCustomers : 0
      const charts: ChartSpec[] = [
        {
          type: 'donut',
          title: 'Repeat vs one-time customers',
          caption: 'What this shows: how many customers came back to buy again.',
          data: [
            { name: 'Repeat customers', value: repeat },
            { name: 'One-time customers', value: totalCustomers - repeat },
          ],
        },
        {
          type: 'bar',
          title: 'Top 10 customers by spend',
          caption: 'What this shows: the customers who spent the most.',
          data: top.map(toRow),
          xKey: 'name',
          series: [{ key: 'sales', label: 'Sales', color: SALES }],
          horizontal: true,
        },
      ]
      if (ctx.has('segment')) {
        const segments = groupBy(rows, (r) => r.segment).sort((a, b) => b.sales - a.sales)
        charts.push({
          type: 'bar',
          title: 'Sales by customer segment',
          caption: 'What this shows: which type of customer spends the most.',
          data: segments.map(toRow),
          xKey: 'name',
          series: salesSeries(ctx),
        })
      }
      return {
        summary: [
          `You have ${totalCustomers.toLocaleString()} customers. ${formatPercent(share(repeat, totalCustomers))} of them bought more than once.`,
          `A customer spends ${formatMoney(avgSpend, ctx.currency)} on average and places ${avgOrders.toFixed(1)} orders.`,
        ],
        kpis: [
          { label: 'Customers', value: totalCustomers.toLocaleString(), hint: 'Different people who bought.' },
          {
            label: 'Repeat rate',
            value: formatPercent(share(repeat, totalCustomers)),
            hint: 'Customers who came back.',
          },
          { label: 'Spend per customer', value: formatMoney(avgSpend, ctx.currency), hint: 'Average money per customer.' },
        ],
        charts,
        table: { ...groupTable(ctx, 'Customer'), rows: top.map(toRow) },
      }
    },
  },
  {
    id: 'profit-loss',
    title: 'Profit & loss',
    question: 'Are we making a profit or a loss?',
    requires: ['sales', 'profit'],
    keywords: ['profit', 'loss', 'nuksan', 'nuksaan', 'munafa', 'margin', 'kamai', 'earning'],
    run(rows, ctx) {
      const totalSales = sum(rows, 'sales')
      const totalProfit = sum(rows, 'profit')
      const months = ctx.has('date')
        ? groupBy(rows, (r) => (r.date ? monthKey(r.date) : null)).sort((a, b) => a.name.localeCompare(b.name))
        : []
      const lossMonths = months.filter((m) => m.profit < 0)
      const lossRows = rows.filter((r) => (r.profit ?? 0) < 0)
      const charts: ChartSpec[] = []
      if (months.length) {
        charts.push({
          type: 'signed-bar',
          title: 'Profit or loss each month',
          caption: 'What this shows: green bars are profit, red bars are loss.',
          data: months.map((m) => ({ label: monthLabel(m.name), profit: m.profit })),
          xKey: 'label',
          valueKey: 'profit',
          label: 'Profit',
        })
      }
      const byCategory = ctx.has('category') ? groupBy(rows, (r) => r.category) : []
      if (byCategory.length) {
        charts.push({
          type: 'signed-bar',
          title: 'Profit by category',
          caption: 'What this shows: which categories earn or lose money.',
          data: byCategory.sort((a, b) => b.profit - a.profit).map((g) => ({ label: g.name, profit: g.profit })),
          xKey: 'label',
          valueKey: 'profit',
          label: 'Profit',
        })
      }
      const summary = [
        totalProfit >= 0
          ? `You made a profit of ${formatMoney(totalProfit, ctx.currency)}. That is ${formatPercent(share(totalProfit, totalSales))} of sales.`
          : `You made a loss of ${formatMoney(Math.abs(totalProfit), ctx.currency)}.`,
        `${formatPercent(share(lossRows.length, rows.length))} of your sales lines lost money.`,
      ]
      if (months.length) {
        summary.push(
          lossMonths.length
            ? `${lossMonths.length} month(s) ended in a loss.`
            : 'Every month ended with a profit.',
        )
      }
      return {
        summary,
        kpis: [
          {
            label: 'Total profit',
            value: formatMoney(totalProfit, ctx.currency),
            hint: 'Money left after costs.',
            tone: totalProfit >= 0 ? 'profit' : 'loss',
          },
          { label: 'Profit margin', value: formatPercent(share(totalProfit, totalSales)), hint: 'Profit kept from every sale.' },
          {
            label: 'Money lost on bad sales',
            value: formatMoney(lossRows.reduce((a, r) => a + (r.profit ?? 0), 0), ctx.currency),
            hint: 'Total of all loss-making lines.',
            tone: 'loss',
          },
        ],
        charts,
        table: months.length
          ? { ...groupTable(ctx, 'Month'), rows: months.map((m) => ({ ...toRow(m), name: monthLabel(m.name) })) }
          : { ...groupTable(ctx, 'Category'), rows: byCategory.map(toRow) },
      }
    },
  },
  {
    id: 'seasonal',
    title: 'Seasonal patterns',
    question: 'Which months and days sell the most?',
    requires: ['sales', 'date'],
    keywords: ['season', 'seasonal', 'festival', 'mausam', 'weekday', 'day', 'din', 'pattern', 'peak'],
    run(rows, ctx) {
      const byMonth = Array.from({ length: 12 }, (_, i) => ({ name: monthName(i), sales: 0, profit: 0, orders: 0 }))
      const byDay = WEEKDAYS.map((d) => ({ name: d, sales: 0, profit: 0, orders: 0 }))
      for (const r of rows) {
        if (!r.date) continue
        const m = byMonth[r.date.getMonth()]
        const d = byDay[(r.date.getDay() + 6) % 7]
        m.sales += r.sales
        m.profit += r.profit ?? 0
        m.orders += 1
        d.sales += r.sales
        d.profit += r.profit ?? 0
        d.orders += 1
      }
      const peak = [...byMonth].sort((a, b) => b.sales - a.sales)[0]
      const slow = [...byMonth].filter((m) => m.orders).sort((a, b) => a.sales - b.sales)[0]
      const bestDay = [...byDay].sort((a, b) => b.sales - a.sales)[0]
      const fmt = (g: { name: string; sales: number; profit: number; orders: number }) => ({
        ...g,
        margin: g.sales ? g.profit / g.sales : 0,
      })
      return {
        summary: peak?.orders
          ? [
              `${peak.name} is your busiest month of the year. ${slow?.name ?? ''} is the slowest.`,
              `${bestDay.name} is the day with the most sales.`,
              'Plan stock and offers before your busy months.',
            ]
          : ['No dated sales found for these filters.'],
        charts: [
          {
            type: 'bar',
            title: 'Sales by month of the year',
            caption: 'What this shows: all years added together, month by month.',
            data: byMonth.map(fmt),
            xKey: 'name',
            series: [{ key: 'sales', label: 'Sales', color: SALES }],
          },
          {
            type: 'bar',
            title: 'Sales by day of the week',
            caption: 'What this shows: which weekdays bring in the most money.',
            data: byDay.map(fmt),
            xKey: 'name',
            series: [{ key: 'sales', label: 'Sales', color: SALES }],
          },
        ],
        table: { ...groupTable(ctx, 'Month'), rows: byMonth.map(fmt) },
      }
    },
  },
  {
    id: 'low-performing',
    title: 'Low-performing products',
    question: 'Which products are not doing well?',
    requires: ['sales', 'product'],
    keywords: ['low', 'worst', 'weak', 'poor', 'kam', 'slow', 'bekar', 'least', 'not doing well', 'underperform'],
    run(rows, ctx) {
      const groups = groupBy(rows, (r) => r.product)
      const useProfit = ctx.has('profit')
      const bottom = [...groups].sort((a, b) => (useProfit ? a.profit - b.profit : a.sales - b.sales)).slice(0, 10)
      const losing = groups.filter((g) => g.profit < 0).length
      const summary = bottom[0]
        ? [
            useProfit
              ? `"${bottom[0].name}" lost the most money (${formatMoney(bottom[0].profit, ctx.currency)}).`
              : `"${bottom[0].name}" has the lowest sales (${formatMoney(bottom[0].sales, ctx.currency)}).`,
          ]
        : ['No products found for these filters.']
      if (useProfit) {
        summary.push(`${losing.toLocaleString()} of ${groups.length.toLocaleString()} products are losing money.`)
        summary.push('See the Loss Report page for reasons and what to do.')
      }
      return {
        summary,
        charts: [
          useProfit
            ? {
                type: 'signed-bar',
                title: 'Bottom 10 products by profit',
                caption: 'What this shows: products that earn the least or lose money.',
                data: bottom.map((g) => ({ label: g.name, profit: g.profit })),
                xKey: 'label',
                valueKey: 'profit',
                label: 'Profit',
              }
            : {
                type: 'bar',
                title: 'Bottom 10 products by sales',
                caption: 'What this shows: products that sell the least.',
                data: bottom.map(toRow),
                xKey: 'name',
                series: [{ key: 'sales', label: 'Sales', color: SALES }],
                horizontal: true,
              },
        ],
        table: { ...groupTable(ctx, 'Product'), rows: bottom.map(toRow) },
      }
    },
  },
]

export const getAnalysis = (id: string) => ANALYSES.find((a) => a.id === id)

export function matchQuestion(question: string): AnalysisDef | null {
  const q = question.toLowerCase()
  let best: { def: AnalysisDef; score: number } | null = null
  for (const def of ANALYSES) {
    const score = def.keywords.reduce((acc, k) => acc + (q.includes(k) ? k.length : 0), 0)
    if (score > 0 && (!best || score > best.score)) best = { def, score }
  }
  return best?.def ?? null
}

export type LossItem = {
  name: string
  sales: number
  profit: number
  orders: number
  avgDiscount: number | null
  reason: string
  action: string
}

export function buildLossReport(rows: SalesRow[], has: (f: FieldKey) => boolean): LossItem[] {
  const groups = groupBy(rows, (r) => r.product).filter((g) => g.profit < 0)
  return groups
    .sort((a, b) => a.profit - b.profit)
    .slice(0, 24)
    .map((g) => {
      const avgDiscount = has('discount') && g.discountCount ? g.discountSum / g.discountCount : null
      const margin = g.sales ? g.profit / g.sales : 0
      let reason = 'The selling price is lower than the cost.'
      let action = 'Check the cost of this product and raise the price if you can.'
      if (avgDiscount != null && avgDiscount >= 0.3) {
        reason = `Big discounts (about ${formatPercent(avgDiscount)} off on average).`
        action = 'Reduce or stop discounts on this product.'
      } else if (margin < -0.5) {
        reason = 'It loses more than half of every sale.'
        action = 'Think about stopping this product or finding a cheaper supplier.'
      } else if (g.orders <= 2) {
        reason = 'Very few orders, so fixed costs are not covered.'
        action = 'Bundle it with a popular product or promote it better.'
      }
      return { name: g.name, sales: g.sales, profit: g.profit, orders: g.orders, avgDiscount, reason, action }
    })
}
