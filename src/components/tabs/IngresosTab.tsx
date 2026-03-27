import { fmt } from '../../utils'
import type { IncomeSource } from '../../types'

interface Props {
  incomeSources:  IncomeSource[]
  totalIncome:    number
  quedaMes:       number
  savings:        number
  onEditIncome:   () => void
  onEditSavings:  () => void
}

export default function IngresosTab({ incomeSources, totalIncome, quedaMes, savings, onEditIncome, onEditSavings }: Props) {
  return (
    <>
      <div className="flex items-center justify-between px-[2px] pt-1">
        <span className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.5px]">Ingresos del mes</span>
        <span className="text-[13px] font-bold text-emerald-600">{fmt(totalIncome)}</span>
      </div>

      {incomeSources.length === 0 ? (
        <div className="text-center py-12 px-4">
          <div className="text-[52px] mb-[10px]">💸</div>
          <div className="text-[16px] font-bold text-slate-500 mb-1">Sin ingresos configurados</div>
          <div className="text-[14px] text-slate-400">Pulsá Editar ingresos para añadir sueldos</div>
        </div>
      ) : (
        incomeSources.map((src, idx) => (
          <div key={String(src.id)} className="bg-white rounded-2xl p-[13px_14px] flex items-center gap-3 shadow-[0_1px_4px_rgba(79,70,229,0.07)]">
            <div className={`w-10 h-10 rounded-[11px] flex items-center justify-center text-[19px] flex-shrink-0 ${idx < 2 ? 'bg-gradient-to-br from-green-100 to-emerald-300' : 'bg-gradient-to-br from-sky-100 to-sky-300'}`}>
              {idx >= 2 ? '⭐' : '👤'}
            </div>
            <div className="flex-1">
              <div className="text-[15px] font-semibold text-[#1e1b4b]">{src.name}</div>
              <div className="text-[12px] text-slate-400 mt-[1px]">{idx >= 2 ? 'Ingreso extra' : 'Sueldo mensual'}</div>
            </div>
            <div className="text-[15px] font-bold text-emerald-600 whitespace-nowrap">{fmt(Number(src.amount))}</div>
          </div>
        ))
      )}

      {incomeSources.length > 0 && (
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-[14px] p-[12px_16px] flex justify-between items-center">
          <span className="text-[13px] font-bold text-emerald-900">Total ingresos</span>
          <span className="text-[18px] font-extrabold text-emerald-600">{fmt(totalIncome)}</span>
        </div>
      )}

      <button
        className="bg-transparent border-2 border-dashed border-[#bbf7d0] rounded-[14px] p-[13px] text-emerald-600 text-[14px] font-semibold cursor-pointer text-center w-full active:bg-green-50"
        onClick={onEditIncome}
      >
        ✏️ Editar ingresos
      </button>

      <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-2xl p-4 border border-violet-200">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[13px] font-bold text-violet-700 uppercase tracking-[0.5px]">🏦 Ahorro acumulado</span>
          <button className="bg-transparent border border-violet-300 rounded-lg px-[10px] py-1 text-[12px] font-semibold text-violet-700 cursor-pointer" onClick={onEditSavings}>Editar</button>
        </div>
        <div className="text-[30px] font-extrabold text-[#4c1d95] mb-[10px]">{fmt(savings)}</div>
        <div className="flex flex-col gap-[6px]">
          <div className="flex justify-between text-[13px]">
            <span className="text-violet-700">Saldo este mes</span>
            <span className={`font-bold text-[#4c1d95] ${quedaMes >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmt(quedaMes)}</span>
          </div>
          <hr className="border-none border-t border-dashed border-violet-300 my-1" />
          <div className="flex justify-between text-[13px]">
            <span className="text-violet-700">Si sumás el saldo del mes</span>
            <span className="font-bold text-[#4c1d95]">{fmt(savings + Math.max(0, quedaMes))}</span>
          </div>
        </div>
      </div>
    </>
  )
}
