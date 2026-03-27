import type { Category } from './types'

export const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export const CATS: Category[] = [
  { id: 'super',       label: 'Super',      emoji: '🛒' },
  { id: 'restaurante', label: 'Resto/Bar',  emoji: '🍽️' },
  { id: 'salud',       label: 'Salud',      emoji: '💊' },
  { id: 'ropa',        label: 'Ropa',       emoji: '👕' },
  { id: 'transporte',  label: 'Transporte', emoji: '🚗' },
  { id: 'ocio',        label: 'Ocio',       emoji: '🎉' },
  { id: 'hogar',       label: 'Hogar',      emoji: '🏠' },
  { id: 'belleza',     label: 'Belleza',    emoji: '💄' },
  { id: 'online',      label: 'Online',     emoji: '📦' },
  { id: 'delivery',    label: 'Delivery',   emoji: '🛵' },
  { id: 'otros',       label: 'Otros',      emoji: '💸' },
]

export const CAT_MAP: Record<string, Category> = Object.fromEntries(CATS.map(c => [c.id, c]))

const FIXED_ICONS: Record<string, string> = {
  Alquiler: '🏠', Garaje: '🚗', Seguro: '🛡️', Prime: '📦',
  Masajes: '💆', Gym: '💪', Netflix: '🎬', Spotify: '🎵',
  Internet: '📡', Teléfono: '📱', Twerk: '💃', Psicóloga: '🧠',
  Luz: '💡', Agua: '🚿',
}

export const fixedIcon = (name: string): string => {
  for (const [k, v] of Object.entries(FIXED_ICONS))
    if (name.toLowerCase().includes(k.toLowerCase())) return v
  return '📋'
}
