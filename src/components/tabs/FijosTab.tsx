import { useState } from 'react'
import { fixedIcon } from '../../constants'
import { fmt } from '../../utils'
import type { FixedExpense } from '../../types'

interface Props {
  fixedExpenses:     FixedExpense[]
  totalFixed:        number
  onEdit:            (e: FixedExpense) => void
  onAdd:             () => void
  prevFixedExpenses: FixedExpense[]
  onCopyFromPrev:    () => void
}

export default function FijosTab({ fixedExpenses, totalFixed, onEdit, onAdd, prevFixedExpenses, onCopyFromPrev }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (fixedExpenses.length > 0 && !window.confirm('¿Reemplazar los fijos de este mes con los del mes anterior? Se perderán los que ya tenés cargados.')) return
    onCopyFromPrev()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <div className="flex items-center justify-between px-[2px] pt-1">
        <span className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.5px]">Gastos fijos mensuales</span>
        <span className="text-[13px] font-bold text-indigo-600">{fmt(totalFixed)}</span>
      </div>

      {prevFixedExpenses.length > 0 && (
        <button
          onClick={handleCopy}
          className={`w-full py-[10px] px-[14px] border-2 border-dashed rounded-[12px] text-[14px] font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all ${copied ? 'border-emerald-300 bg-green-50 text-emerald-600' : 'border-amber-300 bg-amber-50 text-amber-700'}`}
        >
          {copied ? '✅ Copiado!' : '📋 Copiar fijos del mes anterior'}
        </button>
      )}

      {fixedExpenses.map(e => (
        <div key={String(e.id)} className="bg-white rounded-2xl p-[13px_14px] flex items-center gap-3 shadow-[0_1px_4px_rgba(79,70,229,0.07)]">
          <div className="w-10 h-10 rounded-[11px] bg-gradient-to-br from-yellow-100 to-yellow-200 flex items-center justify-center text-[19px] flex-shrink-0">
            {fixedIcon(e.name)}
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-semibold text-[#1e1b4b]">{e.name}</div>
            <div className="text-[12px] text-slate-400 mt-[1px]">Se repite cada mes</div>
          </div>
          <div className="text-[15px] font-bold text-amber-600 whitespace-nowrap">{fmt(e.amount)}</div>
          <button className="bg-transparent border-none text-[#c7d2fe] text-[20px] cursor-pointer p-1 flex-shrink-0" onClick={() => onEdit(e)}>✎</button>
        </div>
      ))}

      <button
        className="bg-transparent border-2 border-dashed border-[#c7d2fe] rounded-[14px] p-[13px] text-indigo-400 text-[14px] font-semibold cursor-pointer text-center w-full active:bg-indigo-50"
        onClick={onAdd}
      >
        + Añadir gasto fijo
      </button>
    </>
  )
}
