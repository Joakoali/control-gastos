import { useState } from "react";
import { toFloat, newId } from "../../utils";
import type { FixedExpense } from "../../types";

interface Props {
  expense: FixedExpense | null;
  onClose: () => void;
  onSave: (e: FixedExpense) => void;
  onDelete: (id: string | number) => void;
}

export default function FixedModal({
  expense,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const [name, setName] = useState(expense?.name || "");
  const [amt, setAmt] = useState(expense?.amount ? String(expense.amount) : "");
  const isNew = !expense?.id;

  const save = () => {
    const a = toFloat(amt);
    if (!name.trim() || a <= 0) return;
    onSave({
      ...(expense || {}),
      id: expense?.id || newId(),
      name: name.trim(),
      amount: a,
    });
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
          {isNew ? "+ Gasto fijo" : "✏️ Editar fijo"}
        </div>

        <div className="mb-3.5">
          <label className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.4px] mb-1.5 block">
            Nombre
          </label>
          <input
            className="w-full p-[13px_14px] border-2 border-slate-200 rounded-[13px] text-[16px] text-[#1e1b4b] outline-none focus:border-indigo-600 bg-white"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Netflix"
            autoFocus
          />
        </div>

        <div className="mb-3.5">
          <label className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.4px] mb-1.5 block">
            Importe mensual (€)
          </label>
          <input
            className="w-full p-[13px_14px] border-2 border-slate-200 rounded-[13px] text-[22px] font-bold text-indigo-600 outline-none focus:border-indigo-600 bg-white appearance-none"
            type="text"
            inputMode="decimal"
            value={amt}
            onChange={(e) => setAmt(e.target.value.replace(/[^0-9.,]/g, ""))}
            placeholder="0,00"
          />
        </div>

        <div className="flex gap-2.5 mt-5">
          {!isNew && (
            <button
              className="flex-1 py-3.75 border-none rounded-[13px] bg-red-100 text-[15px] font-bold text-red-500 cursor-pointer"
              onClick={() => {
                onDelete(expense!.id);
                onClose();
              }}
            >
              Eliminar
            </button>
          )}
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
