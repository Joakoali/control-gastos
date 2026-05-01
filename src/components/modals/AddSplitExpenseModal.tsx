import { useState } from 'react'
import { toFloat } from '../../utils'
import { participantKey } from '../../splitUtils'
import type { Split, SplitExpense } from '../../types'

interface Props {
  split: Split
  currentUid: string
  onClose: () => void
  onSave: (expense: Omit<SplitExpense, 'id'>) => void
}

export default function AddSplitExpenseModal({ split, currentUid, onClose, onSave }: Props) {
  const allKeys = split.participants.map(participantKey)
  const [description, setDescription] = useState('')
  const [amt, setAmt]                 = useState('')
  const [paidBy, setPaidBy]           = useState(
    allKeys.includes(currentUid) ? currentUid : allKeys[0]
  )
  const [splitAmong, setSplitAmong]   = useState<string[]>(allKeys)

  const toggle = (key: string) =>
    setSplitAmong(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])

  const save = () => {
    const amount = toFloat(amt)
    if (!description.trim() || amount <= 0 || splitAmong.length === 0) return
    onSave({ description: description.trim(), amount, paidBy, splitAmong })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-[rgba(15,10,40,0.6)] z-50 flex items-end backdrop-blur-xs"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-[28px_28px_0_0] w-full max-w-120 mx-auto p-[20px_20px_44px] max-h-[92vh] overflow-y-auto">
        <div className="w-9 h-1 bg-slate-200 rounded-xs mx-auto mb-4.5" />
        <div className="text-[21px] font-extrabold text-[#1e1b4b] mb-4.5">+ Agregar gasto</div>

        {/* Description */}
        <div className="mb-3.5">
          <label className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.4px] mb-1.5 block">
            Descripción
          </label>
          <input
            className="w-full p-[13px_14px] border-2 border-slate-200 rounded-[13px] text-[16px] text-[#1e1b4b] outline-none focus:border-indigo-600 bg-white"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Ej: Carne y coca"
            autoFocus
          />
        </div>

        {/* Amount */}
        <div className="mb-3.5">
          <label className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.4px] mb-1.5 block">
            Importe (€)
          </label>
          <input
            className="w-full p-[13px_14px] border-2 border-slate-200 rounded-[13px] text-[22px] font-bold text-indigo-600 outline-none focus:border-indigo-600 bg-white appearance-none"
            type="text"
            inputMode="decimal"
            value={amt}
            onChange={e => setAmt(e.target.value.replace(/[^0-9.,]/g, ''))}
            placeholder="0,00"
          />
        </div>

        {/* Paid by */}
        <div className="mb-3.5">
          <label className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.4px] mb-1.5 block">
            ¿Quién pagó?
          </label>
          <div className="flex flex-col gap-1.5">
            {split.participants.map(p => {
              const key     = participantKey(p)
              const active  = paidBy === key
              return (
                <button
                  key={key}
                  onClick={() => setPaidBy(key)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-[11px] border-2 cursor-pointer text-left transition-colors ${
                    active ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <span className="text-[15px]">{p.type === 'user' ? '👤' : '🙂'}</span>
                  <span className={`text-[14px] font-semibold ${active ? 'text-indigo-700' : 'text-[#1e1b4b]'}`}>
                    {p.name}{p.type === 'user' && p.uid === currentUid ? ' (vos)' : ''}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Split among */}
        <div className="mb-5">
          <label className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.4px] mb-1.5 block">
            ¿Entre quiénes? ({splitAmong.length})
          </label>
          <div className="flex flex-col gap-1.5">
            {split.participants.map(p => {
              const key     = participantKey(p)
              const checked = splitAmong.includes(key)
              return (
                <button
                  key={key}
                  onClick={() => toggle(key)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-[11px] border-2 cursor-pointer text-left transition-colors ${
                    checked ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <span className="text-[16px]">{checked ? '☑️' : '⬜'}</span>
                  <span className="text-[15px]">{p.type === 'user' ? '👤' : '🙂'}</span>
                  <span className={`text-[14px] font-semibold ${checked ? 'text-indigo-700' : 'text-[#1e1b4b]'}`}>
                    {p.name}{p.type === 'user' && p.uid === currentUid ? ' (vos)' : ''}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex gap-2.5">
          <button
            className="flex-1 py-3.75 border-2 border-slate-200 rounded-[13px] bg-white text-[15px] font-semibold text-slate-500 cursor-pointer"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="flex-2 py-3.75 border-none rounded-[13px] bg-linear-to-br from-indigo-600 to-violet-600 text-[15px] font-bold text-white cursor-pointer disabled:opacity-50"
            onClick={save}
            disabled={!description.trim() || toFloat(amt) <= 0 || splitAmong.length === 0}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
