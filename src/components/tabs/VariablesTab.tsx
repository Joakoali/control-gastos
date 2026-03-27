import { useState } from 'react'
import { CAT_MAP } from '../../constants'
import { fmt } from '../../utils'
import type { Expense } from '../../types'

const fmtDate = (d: string) => {
  if (!d) return ''
  const [, m, day] = d.split('-')
  return `${day}/${m}`
}

const CAT_BG: Record<string, string> = {
  super:       'bg-gradient-to-br from-green-100 to-green-200',
  restaurante: 'bg-gradient-to-br from-red-100 to-red-200',
  salud:       'bg-gradient-to-br from-sky-100 to-sky-200',
  ropa:        'bg-gradient-to-br from-fuchsia-100 to-purple-200',
  transporte:  'bg-gradient-to-br from-yellow-100 to-yellow-200',
  ocio:        'bg-gradient-to-br from-orange-100 to-orange-200',
  hogar:       'bg-gradient-to-br from-green-50 to-green-100',
  belleza:     'bg-gradient-to-br from-pink-50 to-pink-100',
  online:      'bg-gradient-to-br from-blue-50 to-blue-100',
  delivery:    'bg-gradient-to-br from-orange-50 to-orange-100',
  otros:       'bg-gradient-to-br from-slate-50 to-slate-100',
}

interface ItemProps {
  expense:  Expense
  onDelete: (id: string | number) => void
  onEdit:   (e: Expense) => void
}

function ExpenseItem({ expense, onDelete, onEdit }: ItemProps) {
  const cat = CAT_MAP[expense.category] || CAT_MAP['otros']
  return (
    <div
      className="bg-white rounded-2xl p-[13px_14px] flex items-center gap-3 shadow-[0_1px_4px_rgba(79,70,229,0.07)] cursor-pointer transition-transform active:scale-[0.985]"
      onClick={() => onEdit(expense)}
    >
      <div className={`w-10 h-10 rounded-[11px] flex items-center justify-center text-[19px] flex-shrink-0 ${CAT_BG[cat.id] ?? CAT_BG['otros']}`}>
        {cat.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-semibold text-[#1e1b4b] whitespace-nowrap overflow-hidden text-ellipsis">{expense.name}</div>
        <div className="text-[12px] text-slate-400 mt-[1px]">{cat.label} · {fmtDate(expense.date)}</div>
      </div>
      <div className="text-[15px] font-bold text-indigo-600 whitespace-nowrap">{fmt(expense.amount)}</div>
      <button
        className="bg-transparent border-none text-slate-200 text-[22px] cursor-pointer px-1 py-[2px] transition-colors active:text-red-500 leading-none flex-shrink-0"
        onClick={e => { e.stopPropagation(); onDelete(expense.id) }}
      >×</button>
    </div>
  )
}

interface Props {
  expenses: Expense[]
  totalVar: number
  onDelete: (id: string | number) => void
  onEdit:   (e: Expense) => void
}

export default function VariablesTab({ expenses, totalVar, onDelete, onEdit }: Props) {
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')

  const sorted = [...expenses].sort((a, b) => {
    const da = a.date || '', db = b.date || ''
    return sortDir === 'desc' ? db.localeCompare(da) : da.localeCompare(db)
  })

  return (
    <>
      <div className="flex items-center justify-between px-[2px] pt-1">
        <span className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.5px]">Gastos variables</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
            className="bg-slate-100 border-none rounded-lg px-[10px] py-1 text-[12px] font-semibold text-slate-500 cursor-pointer flex items-center gap-1"
          >
            {sortDir === 'desc' ? '↓ Reciente' : '↑ Antiguo'}
          </button>
          <span className="text-[13px] font-bold text-indigo-600">{fmt(totalVar)}</span>
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-12 px-4">
          <div className="text-[52px] mb-[10px]">🧾</div>
          <div className="text-[16px] font-bold text-slate-500 mb-1">Sin gastos este mes</div>
          <div className="text-[14px] text-slate-400">Pulsá el botón de abajo para añadir</div>
        </div>
      ) : (
        sorted.map(e => <ExpenseItem key={String(e.id)} expense={e} onDelete={onDelete} onEdit={onEdit} />)
      )}
    </>
  )
}
