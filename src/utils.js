export const fmt = n =>
  n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'

export const toFloat = s => parseFloat(String(s).replace(',', '.')) || 0

export const newId = () => Date.now() + Math.random()

export const mkKey = (year, month) => `${year}-${month}`

export const todayStr = () => new Date().toISOString().split('T')[0]
