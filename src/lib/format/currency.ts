/**
 * Money formatting utilities.
 * Single source of truth — tabular-nums, typographic minus, thin-space thousands.
 */

const rubFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const numberFormatter = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const compactFormatter = new Intl.NumberFormat('ru-RU', {
  notation: 'compact',
  compactDisplay: 'short',
  maximumFractionDigits: 1,
})

export function formatMoney(amount: string | number, currency = 'RUB'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (!Number.isFinite(num)) return '—'

  if (currency === 'RUB') {
    return rubFormatter.format(num).replace('-', '−')
  }

  return `${numberFormatter.format(num).replace('-', '−')} ${currency}`
}

export function formatCompact(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (!Number.isFinite(num)) return '—'
  return compactFormatter.format(num)
}

export function formatPercent(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (!Number.isFinite(num)) return '—'
  return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`
}

export function formatSigned(amount: string | number, currency = 'RUB'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (!Number.isFinite(num)) return '—'
  if (num >= 0) return `+${formatMoney(num, currency)}`
  return formatMoney(num, currency)
}
