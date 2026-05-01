import { useState } from 'react'
import { fmt } from '../../utils'
import { calculateBalances, participantKey } from '../../splitUtils'
import type { Split, SplitExpense } from '../../types'

interface Props {
  split: Split
  currentUid: string
  onBack: () => void
  onAddParticipant: () => void
  onAddExpense: () => void
  onEditExpense: (expense: SplitExpense) => void
  onDeleteExpense: (expenseId: string) => void
  onDeleteSplit: () => void
  onClose: () => void
}

type ConfirmState =
  | { type: 'close' }
  | { type: 'delete-expense'; expense: SplitExpense }
  | { type: 'delete-split' }
  | null

function displayName(key: string, split: Split): string {
  const p = split.participants.find(p => participantKey(p) === key)
  return p?.name ?? key
}

export default function SplitDetail({
  split,
  currentUid,
  onBack,
  onAddParticipant,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  onDeleteSplit,
  onClose,
}: Props) {
  const [confirm, setConfirm] = useState<ConfirmState>(null)
  const { transfers } = calculateBalances(split.expenses, split.participants)
  const isCreator = split.createdBy === currentUid
  const canDelete = split.participantUids.includes(currentUid)
  const canEdit = split.status === 'open'

  const confirmTitle =
    confirm?.type === 'delete-expense' ? 'Borrar gasto'
    : confirm?.type === 'delete-split' ? 'Borrar evento'
    : 'Cerrar evento'

  const confirmBody =
    confirm?.type === 'delete-expense'
      ? `Vas a borrar "${confirm.expense.description}". Esta accion no se puede deshacer.`
      : confirm?.type === 'delete-split'
        ? 'Vas a borrar el evento completo con todos sus gastos. Esta accion no se puede deshacer.'
        : 'Cada participante con cuenta en la app recibira una notificacion con su gasto real. Esta accion no se puede deshacer.'

  const confirmActionLabel =
    confirm?.type === 'delete-expense' ? 'Borrar gasto'
    : confirm?.type === 'delete-split' ? 'Borrar evento'
    : 'Cerrar evento'

  const confirmActionClass =
    confirm?.type === 'close'
      ? 'bg-linear-to-br from-indigo-600 to-violet-600 text-white'
      : 'bg-red-500 text-white'

  const runConfirm = () => {
    if (!confirm) return
    if (confirm.type === 'delete-expense') onDeleteExpense(confirm.expense.id)
    if (confirm.type === 'delete-split') onDeleteSplit()
    if (confirm.type === 'close') onClose()
    setConfirm(null)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 px-0.5 pt-1">
        <button
          onClick={onBack}
          aria-label="Volver"
          className="bg-transparent border-none text-indigo-600 text-[28px] leading-none cursor-pointer px-1 py-0"
        >
          &lsaquo;
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

      <div className="bg-white rounded-2xl p-4 shadow-[0_1px_4px_rgba(79,70,229,0.07)]">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.4px]">
            Participantes
          </div>
          {canEdit && (
            <button
              onClick={onAddParticipant}
              className="border-none rounded-full bg-indigo-50 text-indigo-600 text-[12px] font-bold px-3 py-1.5 cursor-pointer"
            >
              + Agregar
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {split.participants.map(p => (
            <span
              key={participantKey(p)}
              className="bg-indigo-50 text-indigo-700 text-[13px] font-semibold px-3 py-1 rounded-full"
            >
              {p.type === 'alias' ? ':) ' : 'User '}{p.name}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-[0_1px_4px_rgba(79,70,229,0.07)]">
        <div className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.4px] mb-2">
          Gastos
        </div>
        {split.expenses.length === 0 ? (
          <div className="text-[14px] text-slate-400 text-center py-4">Sin gastos aun</div>
        ) : (
          <div className="flex flex-col gap-3">
            {split.expenses.map(exp => (
              <div key={exp.id} className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-[#1e1b4b]">{exp.description}</div>
                  <div className="text-[12px] text-slate-400">
                    Pago {displayName(exp.paidBy, split)} | entre {exp.splitAmong.length}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="text-[14px] font-bold text-indigo-600 whitespace-nowrap">
                    {fmt(exp.amount)}
                  </div>
                  {canEdit && (
                    <>
                      <button
                        onClick={() => onEditExpense(exp)}
                        aria-label={`Editar ${exp.description}`}
                        className="h-8 px-2 border-none rounded-full bg-indigo-50 text-indigo-600 text-[11px] font-bold cursor-pointer"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setConfirm({ type: 'delete-expense', expense: exp })}
                        aria-label={`Borrar ${exp.description}`}
                        className="w-8 h-8 border-none rounded-full bg-red-50 text-red-500 text-[18px] font-bold cursor-pointer leading-none"
                      >
                        x
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {split.expenses.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-[0_1px_4px_rgba(79,70,229,0.07)]">
          <div className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.4px] mb-2">
            Saldos
          </div>
          {transfers.length === 0 ? (
            <div className="text-[14px] text-slate-400 text-center py-2">Todos en cero</div>
          ) : (
            <div className="flex flex-col gap-2">
              {transfers.map((t, i) => (
                <div key={`${t.from}-${t.to}-${i}`} className="flex items-center gap-2 text-[14px]">
                  <span className="font-semibold text-red-500">{displayName(t.from, split)}</span>
                  <span className="text-slate-400">-&gt;</span>
                  <span className="font-semibold text-green-600">{displayName(t.to, split)}</span>
                  <span className="ml-auto font-bold text-[#1e1b4b]">{fmt(t.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(split.status === 'open' || canDelete) && (
        <div className="flex flex-col gap-2 mt-1">
          {split.status === 'open' && (
            <>
              <button
                onClick={onAddExpense}
                className="w-full py-3.75 border-none rounded-[13px] bg-linear-to-br from-indigo-600 to-violet-600 text-[15px] font-bold text-white cursor-pointer"
              >
                + Agregar gasto
              </button>
              {isCreator && (
                <button
                  onClick={() => setConfirm({ type: 'close' })}
                  className="w-full py-3.75 border-2 border-slate-200 rounded-[13px] bg-white text-[15px] font-semibold text-slate-600 cursor-pointer"
                >
                  Cerrar evento
                </button>
              )}
            </>
          )}
          {canDelete && (
            <button
              onClick={() => setConfirm({ type: 'delete-split' })}
              className="w-full py-3.75 border-2 border-red-100 rounded-[13px] bg-red-50 text-[15px] font-semibold text-red-500 cursor-pointer"
            >
              Borrar evento
            </button>
          )}
        </div>
      )}

      {confirm && (
        <div
          className="fixed inset-0 bg-[rgba(15,10,40,0.6)] z-50 flex items-end backdrop-blur-xs"
          onClick={e => e.target === e.currentTarget && setConfirm(null)}
        >
          <div className="bg-white rounded-[28px_28px_0_0] w-full max-w-120 mx-auto p-[20px_20px_44px]">
            <div className="w-9 h-1 bg-slate-200 rounded-xs mx-auto mb-4.5" />
            <div className="text-[21px] font-extrabold text-[#1e1b4b] mb-2">{confirmTitle}</div>
            <div className="text-[14px] text-slate-400 mb-5">{confirmBody}</div>
            <div className="flex gap-2.5">
              <button
                className="flex-1 py-3.75 border-2 border-slate-200 rounded-[13px] bg-white text-[15px] font-semibold text-slate-500 cursor-pointer"
                onClick={() => setConfirm(null)}
              >
                Cancelar
              </button>
              <button
                className={`flex-2 py-3.75 border-none rounded-[13px] text-[15px] font-bold cursor-pointer ${confirmActionClass}`}
                onClick={runConfirm}
              >
                {confirmActionLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
