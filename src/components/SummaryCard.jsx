import { fmt } from "../utils";

export default function SummaryCard({
  totalIncome,
  totalVar,
  totalFixed,
  savings,
  quedaMes,
  activeTab,
  onTabChange,
}) {
  const quedaClass = quedaMes >= 0 ? "pos" : "neg";

  return (
    <div className="summary-card">
      <div className="summary-main">
        <div>
          <div className="summary-queda-label">Queda este mes</div>
          <div className={`summary-queda-val ${quedaClass}`}>
            {fmt(quedaMes)}
          </div>
        </div>
        {savings > 0 && (
          <div className="summary-ahorro">
            <div className="summary-ahorro-label">Ahorro total</div>
            <div className="summary-ahorro-val">{fmt(savings)}</div>
          </div>
        )}
      </div>

      <div className="summary-chips">
        <button
          className={`chip ${activeTab === "variables" ? "active" : "inactive"}`}
          onClick={() => onTabChange("variables")}
        >
          <div className="chip-label">📊 Variables</div>
          <div className="chip-val expense">{fmt(totalVar)}</div>
        </button>
        <button
          className={`chip ${activeTab === "fijos" ? "active" : "inactive"}`}
          onClick={() => onTabChange("fijos")}
        >
          <div className="chip-label">📌 Fijos</div>
          <div className="chip-val expense">{fmt(totalFixed)}</div>
        </button>
        <button
          className={`chip ${activeTab === "ingresos" ? "active" : "inactive"}`}
          onClick={() => onTabChange("ingresos")}
        >
          <div className="chip-label">💰 Ingresos</div>
          <div className="chip-val income">{fmt(totalIncome)}</div>
        </button>
        <div className="chip">
          <div className="chip-label">📋 Total gastos</div>
          <div className="chip-val expense">{fmt(totalVar + totalFixed)}</div>
        </div>
      </div>
    </div>
  );
}
