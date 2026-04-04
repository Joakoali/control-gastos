import { useState, useRef, useEffect } from 'react'
import { CATS } from '../../constants'
import { toFloat } from '../../utils'
import type { Expense } from '../../types'

interface Props {
  initial:  Partial<Expense> | null
  onClose:  () => void
  onSave:   (e: Omit<Expense, 'id'>) => void
}

export default function AddModal({ initial, onClose, onSave }: Props) {
  const [name, setName] = useState(initial?.name || '')
  const [amt,  setAmt]  = useState(initial?.amount ? String(initial.amount) : '')
  const [cat,  setCat]  = useState(initial?.category || 'otros')
  const [date, setDate] = useState(initial?.date || new Date().toISOString().split('T')[0])
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setTimeout(() => nameRef.current?.focus(), 300) }, [])

  const save = () => {
    const a = toFloat(amt)
    if (!name.trim() || a <= 0) return
    onSave({ name: name.trim(), amount: a, category: cat, date })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-[rgba(15,10,40,0.6)] z-50 flex items-end backdrop-blur-[4px]" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-[28px_28px_0_0] w-full max-w-[480px] mx-auto p-[20px_20px_44px] max-h-[92vh] overflow-y-auto">
        <div className="w-9 h-1 bg-slate-200 rounded-[2px] mx-auto mb-[18px]" />
        <div className="text-[21px] font-extrabold text-[#1e1b4b] mb-[18px]">{initial ? '✏️ Editar gasto' : '+ Añadir gasto'}</div>

        <div className="mb-[14px]">
          <label className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.4px] mb-[6px] block">Descripción</label>
          <input ref={nameRef} className="w-full p-[13px_14px] border-2 border-slate-200 rounded-[13px] text-[16px] text-[#1e1b4b] outline-none focus:border-indigo-600 bg-white" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && save()} placeholder="Ej: Mercadona" />
        </div>

        <div className="mb-[14px]">
          <label className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.4px] mb-[6px] block">Importe (€)</label>
          <input className="w-full p-[13px_14px] border-2 border-slate-200 rounded-[13px] text-[22px] font-bold text-indigo-600 outline-none focus:border-indigo-600 bg-white [appearance:none]" type="text" inputMode="decimal" value={amt} onChange={e => setAmt(e.target.value.replace(/[^0-9.,]/g, ''))} onKeyDown={e => e.key === 'Enter' && save()} placeholder="0,00" />
        </div>

        <div className="mb-[14px]">
          <label className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.4px] mb-[6px] block">Fecha</label>
          <input className="w-full p-[13px_14px] border-2 border-slate-200 rounded-[13px] text-[16px] text-[#1e1b4b] outline-none focus:border-indigo-600 bg-white" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>

        <div className="mb-[14px]">
          <label className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.4px] mb-[6px] block">Categoría</label>
          <div className="grid grid-cols-4 gap-[7px]">
            {CATS.map(c => (
              <button key={c.id} onClick={() => setCat(c.id)}
                className={`border-2 rounded-[13px] p-[9px_4px] flex flex-col items-center gap-[3px] cursor-pointer ${cat === c.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 bg-white'}`}>
                <span className="text-[20px]">{c.emoji}</span>
                <span className={`text-[10px] font-semibold text-center ${cat === c.id ? 'text-indigo-600' : 'text-slate-500'}`}>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-[10px] mt-5">
          <button className="flex-1 py-[15px] border-2 border-slate-200 rounded-[13px] bg-white text-[15px] font-semibold text-slate-500 cursor-pointer" onClick={onClose}>Cancelar</button>
          <button className="flex-[2] py-[15px] border-none rounded-[13px] bg-gradient-to-br from-indigo-600 to-violet-600 text-[15px] font-bold text-white cursor-pointer" onClick={save}>Guardar</button>
        </div>
      </div>
    </div>
  )
}
