export const FIELD_KEYS = [
  'date',
  'sales',
  'profit',
  'quantity',
  'discount',
  'product',
  'category',
  'region',
  'customer',
  'orderId',
  'segment',
] as const

export type FieldKey = (typeof FIELD_KEYS)[number]

export type Mapping = Partial<Record<FieldKey, string>>

export type Currency = 'USD' | 'INR' | 'EUR' | 'GBP'

export type SalesRow = {
  date: Date | null
  sales: number
  profit: number | null
  quantity: number | null
  discount: number | null
  product: string | null
  category: string | null
  region: string | null
  customer: string | null
  orderId: string | null
  segment: string | null
}

export type RawRecord = Record<string, string>

export type Dataset = {
  fileName: string
  headers: string[]
  raw: RawRecord[]
  mapping: Mapping
  currency: Currency | null
  confirmed: boolean
}

export type Filters = {
  from: string
  to: string
  region: string
  category: string
  segment: string
}

export const EMPTY_FILTERS: Filters = {
  from: '',
  to: '',
  region: 'all',
  category: 'all',
  segment: 'all',
}

export const FIELD_LABELS: Record<FieldKey, string> = {
  date: 'Order date',
  sales: 'Sales amount',
  profit: 'Profit',
  quantity: 'Quantity',
  discount: 'Discount',
  product: 'Product',
  category: 'Category',
  region: 'Region',
  customer: 'Customer',
  orderId: 'Order ID',
  segment: 'Customer segment',
}

export const REQUIRED_FIELDS: FieldKey[] = ['date', 'sales']
