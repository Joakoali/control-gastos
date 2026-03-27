import { fmt } from '../utils'
import type { TabType } from '../types'

interface Props {
  totalIncome: number
  totalVar:    number
  totalFixed:  number
  savings:     number
  quedaMes:    number
  activeTab:   TabType
  onTabChange: (tab: TabType) => void
}

export default function SummaryCard({ totalIncome, totalVar, totalFixed, savings, quedaMes, activeTab, onTabChange }: Props) {
  const quedaClass = quedaMes >= 0 ? 'text-cyan-300' : 'text-red-300'

  const chip = (tab: TabType) =>
    `border-none cursor-pointer bg-white/[0.12] rounded-[20px] px-3 py-[7px] whitespace-nowrap flex-shrink-0 text-left transition-all ${
      activeTab === tab ? 'bg-white/30 outline outline-2 outline-white/60' : ''
    }`

  return (
    <div className="bg-white/[0.14] backdrop-blur-[12px] rounded-[18px_18px_0_0] px-4 pt-[14px] border border-white/20 border-b-0">
      <div className="flex items-end justify-between mb-3">
        <div>
          <div className="text-white/[0.72] text-[12px] font-semibold uppercase tracking-[0.5px]">Queda este mes</div>
          <div className={`text-[32px] font-extrabold leading-[1.1] ${quedaClass}`}>{fmt(quedaMes)}</div>
        </div>
        {savings > 0 && (
          <div className="text-right">
            <div className="text-white/[0.65] text-[11px] font-semibold uppercase tracking-[0.4px]">Ahorro total</div>
            <div className="text-violet-300 text-[18px] font-extrabold">{fmt(savings)}</div>
          </div>
        )}
      </div>

      <div className="flex gap-[6px] pb-[14px] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button className={chip('variables')} onClick={() => onTabChange('variables')}>
          <div className="text-white/[0.65] text-[10px] font-semibold uppercase tracking-[0.4px]">📊 Variables</div>
          <div className="text-red-300 text-[14px] font-bold mt-[1px]">{fmt(totalVar)}</div>
        </button>
        <button className={chip('fijos')} onClick={() => onTabChange('fijos')}>
          <div className="text-white/[0.65] text-[10px] font-semibold uppercase tracking-[0.4px]">📌 Fijos</div>
          <div className="text-red-300 text-[14px] font-bold mt-[1px]">{fmt(totalFixed)}</div>
        </button>
        <button className={chip('ingresos')} onClick={() => onTabChange('ingresos')}>
          <div className="text-white/[0.65] text-[10px] font-semibold uppercase tracking-[0.4px]">💰 Ingresos</div>
          <div className="text-green-300 text-[14px] font-bold mt-[1px]">{fmt(totalIncome)}</div>
        </button>
        <div className="bg-white/[0.12] rounded-[20px] px-3 py-[7px] whitespace-nowrap flex-shrink-0">
          <div className="text-white/[0.65] text-[10px] font-semibold uppercase tracking-[0.4px]">📋 Total gastos</div>
          <div className="text-red-300 text-[14px] font-bold mt-[1px]">{fmt(totalVar + totalFixed)}</div>
        </div>
      </div>
    </div>
  )
}
