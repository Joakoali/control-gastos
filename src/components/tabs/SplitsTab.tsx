import type { Split } from '../../types'

interface Props {
  splits: Split[]
  onSelect: (split: Split) => void
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })

export default function SplitsTab({ splits, onSelect }: Props) {
  if (splits.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="text-[52px] mb-2.5">🤝</div>
        <div className="text-[16px] font-bold text-slate-500 mb-1">Sin divisiones</div>
        <div className="text-[14px] text-slate-400">
          Pulsá el botón de abajo para crear un evento compartido
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between px-0.5 pt-1">
        <span className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.5px]">
          Eventos compartidos
        </span>
      </div>
      {splits.map(split => (
        <button
          key={split.id}
          onClick={() => onSelect(split)}
          className="w-full text-left bg-white rounded-2xl p-[13px_14px] flex items-center gap-3 shadow-[0_1px_4px_rgba(79,70,229,0.07)] cursor-pointer transition-transform active:scale-[0.985] border-none"
        >
          <div className="w-10 h-10 rounded-[11px] bg-linear-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-[19px] shrink-0">
            🤝
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-semibold text-[#1e1b4b] truncate">{split.title}</div>
            <div className="text-[12px] text-slate-400 mt-px">
              {split.participants.length} participantes · {fmtDate(split.createdAt)}
            </div>
          </div>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
            split.status === 'open'
              ? 'bg-green-100 text-green-700'
              : 'bg-slate-100 text-slate-500'
          }`}>
            {split.status === 'open' ? 'Abierto' : 'Cerrado'}
          </span>
        </button>
      ))}
    </>
  )
}
