/**
 * Date formatting utilities.
 * Single source of truth — tabular-nums on dates.
 */

import { format, isToday, isYesterday } from 'date-fns'
import { ru } from 'date-fns/locale'

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'd MMM yyyy', { locale: ru })
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'dd.MM.yyyy')
}

export function formatDateRelative(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isToday(d)) return 'Сегодня'
  if (isYesterday(d)) return 'Вчера'
  return formatDate(d)
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'd MMM yyyy, HH:mm', { locale: ru })
}

export function formatMonth(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'LLLL yyyy', { locale: ru })
}
