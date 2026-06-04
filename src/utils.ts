import type { MonthData } from './types'

export const fmt = (n: number): string =>
  n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'

export const toFloat = (s: string | number): number =>
  parseFloat(String(s).replace(',', '.')) || 0

export const newId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2)}`

export const mkKey = (year: number, month: number): string => `${year}-${month}`

export const parseKey = (key: string): [number, number] => {
  const [year, month] = key.split('-').map(Number)
  return [year, month]
}

export const compareMonthKeys = (a: string, b: string): number => {
  const [ay, am] = parseKey(a)
  const [by, bm] = parseKey(b)
  return ay !== by ? ay - by : am - bm
}

export function resolveForMonth<K extends keyof MonthData>(
  months: Record<string, MonthData> | undefined,
  targetKey: string,
  field: K,
  fallback: NonNullable<MonthData[K]>,
): NonNullable<MonthData[K]> {
  if (!months) return fallback
  const keys = Object.keys(months)
    .filter((k) => compareMonthKeys(k, targetKey) <= 0)
    .sort((a, b) => compareMonthKeys(b, a)) // más nuevo primero
  for (const k of keys) {
    const val = months[k]?.[field]
    if (val !== undefined && val !== null) {
      return val as NonNullable<MonthData[K]>
    }
  }
  return fallback
}
