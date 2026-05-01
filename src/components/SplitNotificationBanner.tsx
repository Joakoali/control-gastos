import { useState } from 'react'
import { CATS, MONTHS } from '../constants'
import { fmt, mkKey } from '../utils'
import type { SplitNotification } from '../types'

interface Props {
  notification: SplitNotification
  currentYear: number
  currentMonth: number
  onAdd: (splitId: string, monthKey: string, category: string) => void
  onDismiss: (splitId: string) => void
}

export default function SplitNotificationBanner({
  notification,
  currentYear,
  currentMonth,
  onAdd,
  onDismiss,
}: Props) {
  const [category, setCategory] = useState('otros')
  const [selYear,  setSelYear]  = useState(currentYear)
  const [selMonth, setSelMonth] = useState(currentMonth)

  const hasExpense = notification.netAmount > 0

  return (
    <div className="fixed inset-0 bg-[rgba(15,10,40,0.6)] z-50 flex items-end backdrop-blur-xs">
      <div className="bg-white rounded-[28px_28px_0_0] w-full max-w-120 mx-auto p-[20px_20px_44px] max-h-[92vh] overflow-y-auto">
        <div className="w-9 h-1 bg-slate-200 rounded-xs mx-auto mb-4.5" />
        <div className="text-[21px] font-extrabold text-[#1e1b4b] mb-1">🤝 {notification.title}</div>
        <div className="text-[14px] text-slate-400 mb-4">Este evento fue cerrado</div>

        {/* Net amount */}
        <div className="bg-indigo-50 rounded-[14px] p-4 mb-4 text-center">
          <div className="text-[12px] text-indigo-700 font-bold uppercase tracking-[0.4px] mb-1">
            Tu gasto real
          </div>
          <div className="text-[36px] font-extrabold text-indigo-700">
            {fmt(notification.netAmount)}
          </div>
        </div>

        {/* Balances */}
        {notification.balances.length > 0 && (
          <div className="bg-slate-50 rounded-[14px] p-3 mb-4">
            <div className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.4px] mb-2">
              Movimientos
            </div>
            {notification.balances.map((b, i) => (
              <div key={i} className="text-[13px] text-slate-600 mb-1">
                <span className="font-semibold text-red-500">{b.from}</span>
                {' → '}
                <span className="font-semibold text-green-600">{b.to}</span>
                {'  '}
                <span className="font-bold text-[#1e1b4b]">{fmt(b.amount)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Month + category (only if there's an expense to register) */}
        {hasExpense && (
          <>
            <div className="mb-3">
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.4px] mb-1.5 block">
                Registrar en mes
              </label>
              <div className="flex gap-2">
                <select
                  className="flex-1 p-[11px_14px] border-2 border-slate-200 rounded-[13px] text-[15px] text-[#1e1b4b] bg-white"
                  value={selMonth}
                  onChange={e => setSelMonth(Number(e.target.value))}
                >
                  {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <select
                  className="w-24 p-[11px_14px] border-2 border-slate-200 rounded-[13px] text-[15px] text-[#1e1b4b] bg-white"
                  value={selYear}
                  onChange={e => setSelYear(Number(e.target.value))}
                >
                  {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mb-5">
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.4px] mb-1.5 block">
                Categoría
              </label>
              <div className="grid grid-cols-4 gap-1.75">
                {CATS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    className={`border-2 rounded-[13px] p-[9px_4px] flex flex-col items-center gap-0.75 cursor-pointer ${
                      category === c.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <span className="text-[20px]">{c.emoji}</span>
                    <span className={`text-[10px] font-semibold text-center ${
                      category === c.id ? 'text-indigo-600' : 'text-slate-500'
                    }`}>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="flex gap-2.5">
          <button
            className="flex-1 py-3.75 border-2 border-slate-200 rounded-[13px] bg-white text-[15px] font-semibold text-slate-500 cursor-pointer"
            onClick={() => onDismiss(notification.splitId)}
          >
            Descartar
          </button>
          {hasExpense && (
            <button
              className="flex-2 py-3.75 border-none rounded-[13px] bg-linear-to-br from-indigo-600 to-violet-600 text-[15px] font-bold text-white cursor-pointer"
              onClick={() => onAdd(notification.splitId, mkKey(selYear, selMonth), category)}
            >
              Agregar a mis gastos
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
