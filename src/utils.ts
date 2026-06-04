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
