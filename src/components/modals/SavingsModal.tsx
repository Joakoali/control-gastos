import { useState } from "react";
import { toFloat, fmt } from "../../utils";

interface Props {
  savings: number;
  quedaMes: number;
  onClose: () => void;
  onSave: (s: number) => void;
}

export default function SavingsModal({
  savings,
  quedaMes,
  onClose,
  onSave,
}: Props) {
  const [val, setVal] = useState(String(savings));

  const save = () => {
    onSave(toFloat(val));
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-[rgba(15,10,40,0.6)] z-50 flex items-end backdrop-blur-xs"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-[28px_28px_0_0] w-full max-w-120 mx-auto p-[20px_20px_44px] max-h-[92vh] overflow-y-auto">
        <div className="w-9 h-1 bg-slate-200 rounded-xs mx-auto mb-4.5" />
        <div className="text-[21px] font-extrabold text-[#1e1b4b] mb-4.5">
          🏦 Ahorro acumulado
        </div>
        <p className="text-[14px] text-slate-500 mb-5 leading-relaxed">
          Este es el total de ahorros que tienen hasta la fecha. Actualizalo
          manualmente cuando quieras.
        </p>

        <div className="mb-3.5">
          <label className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.4px] mb-1.5 block">
            Ahorros totales actuales (€)
          </label>
          <input
            className="w-full p-[13px_14px] border-2 border-slate-200 rounded-[13px] text-[22px] font-bold text-violet-700 outline-none focus:border-violet-600 bg-white appearance-none"
            type="text"
            inputMode="decimal"
            value={val}
            onChange={(e) => setVal(e.target.value.replace(/[^0-9.,]/g, ""))}
            placeholder="0,00"
            autoFocus
          />
        </div>

        <div className="bg-violet-50 rounded-[13px] p-[12px_14px] mb-1">
          <div className="text-[12px] text-violet-700 font-bold uppercase tracking-[0.4px] mb-1.5">
            Referencia este mes
          </div>
          <div className="flex justify-between text-[14px]">
            <span className="text-slate-500">Saldo que queda este mes</span>
            <span
              className={`font-bold ${quedaMes >= 0 ? "text-emerald-600" : "text-red-500"}`}
            >
              {fmt(quedaMes)}
            </span>
          </div>
          <div className="flex justify-between text-[14px] mt-1.5">
            <span className="text-slate-500">Si sumás el saldo</span>
            <span className="font-bold text-violet-700">
              {fmt(toFloat(val) + Math.max(0, quedaMes))}
            </span>
          </div>
        </div>

        <div className="flex gap-2.5 mt-5">
          <button
            className="flex-1 py-3.75 border-2 border-slate-200 rounded-[13px] bg-white text-[15px] font-semibold text-slate-500 cursor-pointer"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="flex-2 py-3.75 border-none rounded-[13px] bg-linear-to-br from-indigo-600 to-violet-600 text-[15px] font-bold text-white cursor-pointer"
            onClick={save}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
