import type { Filters, SalesRow } from './types'

export type Group = {
  name: string
  sales: number
  profit: number
  orders: number
  quantity: number
  discountSum: number
  discountCount: number
}

export function applyFilters(rows: SalesRow[], filters: Filters): SalesRow[] {
  const from = filters.from ? new Date(`${filters.from}T00:00:00`) : null
  const to = filters.to ? new Date(`${filters.to}T23:59:59`) : null
  return rows.filter((r) => {
    if (from && (!r.date || r.date < from)) return false
    if (to && (!r.date || r.date > to)) return false
    if (filters.region !== 'all' && r.region !== filters.region) return false
    if (filters.category !== 'all' && r.category !== filters.category) return false
    if (filters.segment !== 'all' && r.segment !== filters.segment) return false
    return true
  })
}

export function uniqueValues(rows: SalesRow[], key: 'region' | 'category' | 'segment'): string[] {
  const set = new Set<string>()
  for (const r of rows) if (r[key]) set.add(r[key] as string)
  return [...set].sort()
}

export function dateRange(rows: SalesRow[]): { min: Date; max: Date } | null {
  let min: Date | null = null
  let max: Date | null = null
  for (const r of rows) {
    if (!r.date) continue
    if (!min || r.date < min) min = r.date
    if (!max || r.date > max) max = r.date
  }
  return min && max ? { min, max } : null
}

export function groupBy(rows: SalesRow[], keyFn: (r: SalesRow) => string | null): Group[] {
  const map = new Map<string, Group & { orderIds: Set<string> }>()
  for (const r of rows) {
    const key = keyFn(r)
    if (key == null) continue
    let g = map.get(key)
    if (!g) {
      g = {
        name: key,
        sales: 0,
        profit: 0,
        orders: 0,
        quantity: 0,
        discountSum: 0,
        discountCount: 0,
        orderIds: new Set(),
      }
      map.set(key, g)
    }
    g.sales += r.sales
    g.profit += r.profit ?? 0
    g.quantity += r.quantity ?? 0
    if (r.discount != null) {
      g.discountSum += r.discount
      g.discountCount += 1
    }
    if (r.orderId) g.orderIds.add(r.orderId)
    else g.orders += 1
  }
  return [...map.values()].map(({ orderIds, ...g }) => ({ ...g, orders: g.orders + orderIds.size }))
}

export function countOrders(rows: SalesRow[]): number {
  const ids = new Set<string>()
  let withoutId = 0
  for (const r of rows) {
    if (r.orderId) ids.add(r.orderId)
    else withoutId += 1
  }
  return ids.size + withoutId
}

export function countCustomers(rows: SalesRow[]): number {
  const ids = new Set<string>()
  for (const r of rows) if (r.customer) ids.add(r.customer)
  return ids.size
}

export const sum = (rows: SalesRow[], key: 'sales' | 'profit') =>
  rows.reduce((acc, r) => acc + (r[key] ?? 0), 0)

const pad = (n: number) => String(n).padStart(2, '0')

export const monthKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`

export function weekKey(d: Date): string {
  const start = new Date(d)
  const day = (start.getDay() + 6) % 7
  start.setDate(start.getDate() - day)
  return `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function monthLabel(key: string): string {
  const [y, m] = key.split('-')
  return `${MONTHS[Number(m) - 1]} ${y.slice(2)}`
}

export function weekLabel(key: string): string {
  const [y, m, d] = key.split('-')
  return `${Number(d)} ${MONTHS[Number(m) - 1]} ${y.slice(2)}`
}

export const monthName = (index: number) => MONTHS[index]
