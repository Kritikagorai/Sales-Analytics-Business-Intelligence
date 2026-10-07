import type { Currency } from './types'

const SYMBOLS: Record<Currency, string> = {
  USD: '$',
  INR: 'Rs. ',
  EUR: '€',
  GBP: '£',
}

const trim = (n: number) => (Math.abs(n) >= 100 ? n.toFixed(0) : n.toFixed(1)).replace(/\.0$/, '')

export function formatMoney(value: number, currency: Currency | null, compact = true): string {
  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(value)
  const symbol = currency ? SYMBOLS[currency] : ''

  if (!compact) {
    const locale = currency === 'INR' ? 'en-IN' : 'en-US'
    return `${sign}${symbol}${abs.toLocaleString(locale, { maximumFractionDigits: 2 })}`
  }

  if (currency === 'INR') {
    if (abs >= 1e7) return `${sign}${symbol}${trim(abs / 1e7)} Crore`
    if (abs >= 1e5) return `${sign}${symbol}${trim(abs / 1e5)} Lakh`
    if (abs >= 1e3) return `${sign}${symbol}${trim(abs / 1e3)}K`
    return `${sign}${symbol}${abs.toFixed(0)}`
  }

  if (abs >= 1e9) return `${sign}${symbol}${trim(abs / 1e9)}B`
  if (abs >= 1e6) return `${sign}${symbol}${trim(abs / 1e6)}M`
  if (abs >= 1e3) return `${sign}${symbol}${trim(abs / 1e3)}K`
  return `${sign}${symbol}${abs.toFixed(0)}`
}

export function formatNumber(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}
