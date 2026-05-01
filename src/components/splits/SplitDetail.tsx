import { useState } from 'react'
import { fmt } from '../../utils'
import { calculateBalances, participantKey } from '../../splitUtils'
import type { Split } from '../../types'

interface Props {
  split: Split
  currentUid: string
  onBack: () => void
  onAddExpense: () => void
  onClose: () => void
}

function displayName(key: string, split: Split): string {
  const p = split.participants.find(p => participantKey(p) === key)
  return p?.name ?? key
}

export default function SplitDetail({ split, currentUid, onBack, onAddExpense, onClose }: Props) {
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const { transfers } = calculateBalances(split.expenses, split.participants)
  const isCreator = split.createdBy === currentUid

  return (
    <div className="flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center gap-2 px-0.5 pt-1">
        <button
          onClick={onBack}
          className="bg-transparent border-none text-indigo-600 text-[28px] leading-none cursor-pointer px-1 py-0"
        >
          ‹
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[17px] font-extrabold text-[#1e1b4b] truncate">{split.title}</div>
          <div className="text-[12px] text-slate-400">{split.participants.length} participantes</div>
        </div>
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
          split.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
        }`}>
          {split.status === 'open' ? 'Abierto' : 'Cerrado'}
        </span>
      </div>

      {/* Participants */}
      <div className="bg-white rounded-2xl p-4 shadow-[0_1px_4px_rgba(79,70,229,0.07)]">
        <div className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.4px] mb-2">
          Participantes
        </div>
        <div className="flex flex-wrap gap-2">
          {split.participants.map(p => (
            <span
              key={participantKey(p)}
              className="bg-indigo-50 text-indigo-700 text-[13px] font-semibold px-3 py-1 rounded-full"
            >
              {p.type === 'alias' ? '🙂 ' : '👤 '}{p.name}
            </span>
          ))}
        </div>
      </div>

      {/* Expenses */}
      <div className="bg-white rounded-2xl p-4 shadow-[0_1px_4px_rgba(79,70,229,0.07)]">
        <div className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.4px] mb-2">
          Gastos
        </div>
        {split.expenses.length === 0 ? (
          <div className="text-[14px] text-slate-400 text-center py-4">Sin gastos aún</div>
        ) : (
          <div className="flex flex-col gap-3">
            {split.expenses.map(exp => (
              <div key={exp.id} className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-[#1e1b4b]">{exp.description}</div>
                  <div className="text-[12px] text-slate-400">
                    Pagó {displayName(exp.paidBy, split)} · entre {exp.splitAmong.length}
                  </div>
                </div>
                <div className="text-[14px] font-bold text-indigo-600 whitespace-nowrap">
                  {fmt(exp.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Balances */}
      {split.expenses.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-[0_1px_4px_rgba(79,70,229,0.07)]">
          <div className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.4px] mb-2">
            Saldos
          </div>
          {transfers.length === 0 ? (
            <div className="text-[14px] text-slate-400 text-center py-2">Todos en cero 🎉</div>
          ) : (
            <div className="flex flex-col gap-2">
              {transfers.map((t, i) => (
                <div key={i} className="flex items-center gap-2 text-[14px]">
                  <span className="font-semibold text-red-500">{displayName(t.from, split)}</span>
                  <span className="text-slate-400">→</span>
                  <span className="font-semibold text-green-600">{displayName(t.to, split)}</span>
                  <span className="ml-auto font-bold text-[#1e1b4b]">{fmt(t.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {split.status === 'open' && (
        <div className="flex flex-col gap-2 mt-1">
          <button
            onClick={onAddExpense}
            className="w-full py-3.75 border-none rounded-[13px] bg-linear-to-br from-indigo-600 to-violet-600 text-[15px] font-bold text-white cursor-pointer"
          >
            + Agregar gasto
          </button>
          {isCreator && (
            <button
              onClick={() => setShowCloseConfirm(true)}
              className="w-full py-3.75 border-2 border-slate-200 rounded-[13px] bg-white text-[15px] font-semibold text-slate-600 cursor-pointer"
            >
              Cerrar evento
            </button>
          )}
        </div>
      )}

      {/* Close confirmation modal */}
      {showCloseConfirm && (
        <div
          className="fixed inset-0 bg-[rgba(15,10,40,0.6)] z-50 flex items-end backdrop-blur-xs"
          onClick={e => e.target === e.currentTarget && setShowCloseConfirm(false)}
        >
          <div className="bg-white rounded-[28px_28px_0_0] w-full max-w-120 mx-auto p-[20px_20px_44px]">
            <div className="w-9 h-1 bg-slate-200 rounded-xs mx-auto mb-4.5" />
            <div className="text-[21px] font-extrabold text-[#1e1b4b] mb-2">Cerrar evento</div>
            <div className="text-[14px] text-slate-400 mb-5">
              Cada participante con cuenta en la app recibirá una notificación con su gasto real. Esta acción no se puede deshacer.
            </div>
            <div className="flex gap-2.5">
              <button
                className="flex-1 py-3.75 border-2 border-slate-200 rounded-[13px] bg-white text-[15px] font-semibold text-slate-500 cursor-pointer"
                onClick={() => setShowCloseConfirm(false)}
              >
                Cancelar
              </button>
              <button
                className="flex-2 py-3.75 border-none rounded-[13px] bg-linear-to-br from-indigo-600 to-violet-600 text-[15px] font-bold text-white cursor-pointer"
                onClick={() => { setShowCloseConfirm(false); onClose() }}
              >
                Cerrar evento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
