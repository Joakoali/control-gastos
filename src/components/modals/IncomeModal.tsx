import { useState } from "react";
import { toFloat, newId, fmt } from "../../utils";
import type { IncomeSource } from "../../types";

interface Props {
  sources: IncomeSource[];
  prevSources: IncomeSource[];
  onClose: () => void;
  onSave: (sources: IncomeSource[]) => void;
}

export default function IncomeModal({
  sources,
  prevSources = [],
  onClose,
  onSave,
}: Props) {
  const [items, setItems] = useState<IncomeSource[]>(
    sources.length > 0
      ? sources.map((s) => ({ ...s }))
      : [
          { id: "i1", name: "Sueldo 1", amount: "" },
          { id: "i2", name: "Sueldo 2", amount: "" },
        ],
  );
  const [copied, setCopied] = useState(false);

  const copyFromPrev = () => {
    if (prevSources.length === 0) return;
    setItems(prevSources.map((s) => ({ ...s, id: newId() })));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const update = (
    id: string | number,
    field: keyof IncomeSource,
    val: string,
  ) =>
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: val } : i)),
    );

  const remove = (id: string | number) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  const add = () =>
    setItems((prev) => [
      ...prev,
      { id: newId(), name: "Extra / Ingreso", amount: "" },
    ]);

  const save = () => {
    const cleaned = items
      .map((i) => ({
        ...i,
        amount: toFloat(i.amount),
        name: (i.name as string).trim() || "Ingreso",
      }))
      .filter((i) => Number(i.amount) > 0);
    onSave(cleaned);
    onClose();
  };

  const total = items.reduce((s, i) => s + toFloat(i.amount), 0);

  return (
    <div
      className="fixed inset-0 bg-[rgba(15,10,40,0.6)] z-50 flex items-end backdrop-blur-xs"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-[28px_28px_0_0] w-full max-w-120 mx-auto p-[20px_20px_44px] max-h-[92vh] overflow-y-auto">
        <div className="w-9 h-1 bg-slate-200 rounded-xs mx-auto mb-4.5" />
        <div className="text-[21px] font-extrabold text-[#1e1b4b] mb-4.5">
          💰 Ingresos del mes
        </div>
        <p className="text-[13px] text-slate-400 mb-3">
          Añadí sueldos, extras, comisiones o cualquier ingreso de este mes.
        </p>

        {prevSources.length > 0 && (
          <button
            onClick={copyFromPrev}
            className={`w-full py-2.5 px-3.5 mb-3.5 border-2 border-dashed border-violet-300 rounded-xl text-[14px] font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all ${copied ? "bg-green-50 text-emerald-600" : "bg-violet-50 text-violet-700"}`}
          >
            {copied ? "✅ Copiado!" : "📋 Copiar sueldos del mes anterior"}
          </button>
        )}

        {items.map((item, idx) => (
          <div
            key={String(item.id)}
            className="bg-slate-50 rounded-[13px] p-[12px_14px] flex items-center gap-2.5 mb-2"
          >
            <span className="text-[20px]">
              {idx === 0 ? "👤" : idx === 1 ? "👤" : "⭐"}
            </span>
            <div className="flex-1 flex flex-col gap-1.5">
              <input
                className="w-full p-[8px_10px] border-2 border-slate-200 rounded-[10px] text-[14px] text-[#1e1b4b] outline-none focus:border-indigo-600 bg-white"
                value={item.name as string}
                onChange={(e) => update(item.id, "name", e.target.value)}
                placeholder="Nombre del ingreso"
              />
              <input
                className="w-full p-[8px_10px] border-2 border-slate-200 rounded-[10px] text-[16px] font-bold text-emerald-600 outline-none focus:border-emerald-500 bg-white appearance-none"
                type="text"
                inputMode="decimal"
                value={item.amount as string}
                onChange={(e) =>
                  update(
                    item.id,
                    "amount",
                    e.target.value.replace(/[^0-9.,]/g, ""),
                  )
                }
                placeholder="0,00"
              />
            </div>
            {items.length > 1 && (
              <button
                className="bg-transparent border-none text-slate-200 text-[22px] cursor-pointer p-0.5 shrink-0 active:text-red-500"
                onClick={() => remove(item.id)}
              >
                ×
              </button>
            )}
          </div>
        ))}

        <button
          className="bg-transparent border-2 border-dashed border-green-200 rounded-[13px] p-2.75 text-emerald-600 text-[14px] font-semibold cursor-pointer text-center w-full mb-1 active:bg-green-50"
          onClick={add}
        >
          + Añadir ingreso / extra
        </button>

        <div className="bg-green-50 rounded-[13px] p-[12px_14px] mt-2">
          <div className="flex justify-between items-center">
            <span className="text-[13px] font-bold text-emerald-900">
              Total ingresos
            </span>
            <span className="text-[18px] font-extrabold text-emerald-600">
              {fmt(total)}
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
