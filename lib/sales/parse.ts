import Papa from 'papaparse'
import type { Currency, FieldKey, Mapping, RawRecord, SalesRow } from './types'

const SYNONYMS: Record<FieldKey, string[]> = {
  date: ['order date', 'orderdate', 'date', 'invoice date', 'sale date', 'transaction date', 'order_date'],
  sales: ['sales', 'revenue', 'amount', 'total', 'sales amount', 'net sales', 'total sales', 'sale amount'],
  profit: ['profit', 'net profit', 'margin amount', 'gross profit'],
  quantity: ['quantity', 'qty', 'units', 'units sold'],
  discount: ['discount', 'discount rate', 'disc'],
  product: ['product name', 'product', 'item', 'item name', 'productname'],
  category: ['category', 'product category', 'sub-category', 'subcategory'],
  region: ['region', 'state', 'zone', 'area', 'city', 'country', 'market'],
  customer: ['customer name', 'customer id', 'customer', 'client', 'customerid', 'customer_id'],
  orderId: ['order id', 'orderid', 'order_id', 'invoice', 'invoice id', 'order number', 'invoice no'],
  segment: ['segment', 'customer segment', 'customer type'],
}

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[_\-.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export function detectMapping(headers: string[]): Mapping {
  const mapping: Mapping = {}
  const used = new Set<string>()
  const normalized = headers.map((h) => ({ original: h, norm: normalize(h) }))

  for (const field of Object.keys(SYNONYMS) as FieldKey[]) {
    for (const synonym of SYNONYMS[field]) {
      const target = normalize(synonym)
      const match = normalized.find((h) => !used.has(h.original) && h.norm === target)
      if (match) {
        mapping[field] = match.original
        used.add(match.original)
        break
      }
    }
  }
  return mapping
}

export function detectCurrency(headers: string[], raw: RawRecord[], salesColumn?: string): Currency | null {
  const headerText = headers.join(' ').toLowerCase()
  if (/\binr\b|₹|\brs\b|rupee/.test(headerText)) return 'INR'
  if (/\busd\b|\$|dollar/.test(headerText)) return 'USD'
  if (/\beur\b|€|euro/.test(headerText)) return 'EUR'
  if (/\bgbp\b|£|pound/.test(headerText)) return 'GBP'

  if (salesColumn) {
    const sample = raw
      .slice(0, 50)
      .map((r) => r[salesColumn] ?? '')
      .join(' ')
    if (/₹|rs\.?\s?\d/i.test(sample)) return 'INR'
    if (/\$/.test(sample)) return 'USD'
    if (/€/.test(sample)) return 'EUR'
    if (/£/.test(sample)) return 'GBP'
  }
  return null
}

export function parseNumber(value: string | undefined): number | null {
  if (value == null) return null
  let text = String(value).trim()
  if (!text) return null
  const negative = /^\(.*\)$/.test(text)
  text = text.replace(/[^\d.\-eE%]/g, '')
  const isPercent = text.endsWith('%')
  text = text.replace('%', '')
  const num = Number.parseFloat(text)
  if (Number.isNaN(num)) return null
  const result = negative ? -Math.abs(num) : num
  return isPercent ? result / 100 : result
}

type DateOrder = 'MDY' | 'DMY'

function detectDateOrder(values: string[]): DateOrder {
  for (const v of values) {
    const parts = v.trim().split(/[/\-.]/)
    if (parts.length !== 3 || parts[0].length === 4) continue
    const a = Number(parts[0])
    const b = Number(parts[1])
    if (a > 12) return 'DMY'
    if (b > 12) return 'MDY'
  }
  return 'MDY'
}

function parseDate(value: string | undefined, order: DateOrder): Date | null {
  if (!value) return null
  const text = value.trim()
  if (!text) return null

  const parts = text.split(/[\s T]/)[0].split(/[/\-.]/)
  if (parts.length === 3 && parts.every((p) => /^\d+$/.test(p))) {
    let year: number
    let month: number
    let day: number
    if (parts[0].length === 4) {
      ;[year, month, day] = parts.map(Number)
    } else if (order === 'DMY') {
      ;[day, month, year] = parts.map(Number)
    } else {
      ;[month, day, year] = parts.map(Number)
    }
    if (year < 100) year += 2000
    const date = new Date(year, month - 1, day)
    return Number.isNaN(date.getTime()) ? null : date
  }

  const fallback = new Date(text)
  return Number.isNaN(fallback.getTime()) ? null : fallback
}

export function parseCsvFile(file: File): Promise<{ headers: string[]; raw: RawRecord[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawRecord>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => h.trim(),
      complete: (result) => {
        const headers = (result.meta.fields ?? []).filter(Boolean)
        resolve({ headers, raw: result.data })
      },
      error: (error) => reject(error),
    })
  })
}

const text = (value: string | undefined) => {
  const t = value?.trim()
  return t ? t : null
}

export function buildRows(raw: RawRecord[], mapping: Mapping): SalesRow[] {
  const dateCol = mapping.date
  const order = dateCol ? detectDateOrder(raw.slice(0, 500).map((r) => r[dateCol] ?? '')) : 'MDY'
  const rows: SalesRow[] = []

  for (const record of raw) {
    const get = (field: FieldKey) => {
      const column = mapping[field]
      return column ? record[column] : undefined
    }
    const sales = parseNumber(get('sales'))
    if (sales == null) continue

    let discount = parseNumber(get('discount'))
    if (discount != null && discount > 1) discount = discount / 100

    rows.push({
      date: parseDate(get('date'), order),
      sales,
      profit: mapping.profit ? parseNumber(get('profit')) : null,
      quantity: mapping.quantity ? parseNumber(get('quantity')) : null,
      discount: mapping.discount ? discount : null,
      product: text(get('product')),
      category: text(get('category')),
      region: text(get('region')),
      customer: text(get('customer')),
      orderId: text(get('orderId')),
      segment: text(get('segment')),
    })
  }
  return rows
}
