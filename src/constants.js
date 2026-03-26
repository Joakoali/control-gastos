export const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export const CATS = [
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

export const CAT_MAP = Object.fromEntries(CATS.map(c => [c.id, c]))

const FIXED_ICONS = {
  Alquiler: '🏠', Garaje: '🚗', Seguro: '🛡️', Prime: '📦',
  Masajes: '💆', Gym: '💪', Netflix: '🎬', Spotify: '🎵',
  Internet: '📡', Teléfono: '📱', Twerk: '💃', Psicóloga: '🧠',
  Luz: '💡', Agua: '🚿',
}

export const fixedIcon = name => {
  for (const [k, v] of Object.entries(FIXED_ICONS))
    if (name.toLowerCase().includes(k.toLowerCase())) return v
  return '📋'
}
