import { fmt } from '../../utils'

export default function IngresosTab({ incomeSources, totalIncome, quedaMes, savings, onEditIncome, onEditSavings }) {
  return (
    <>
      <div className="section-header">
        <span className="section-title">Ingresos del mes</span>
        <span className="section-total" style={{ color: '#059669' }}>{fmt(totalIncome)}</span>
      </div>

      {incomeSources.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">💸</div>
          <div className="empty-title">Sin ingresos configurados</div>
          <div className="empty-sub">Pulsá el 💰 arriba para añadir sueldos</div>
        </div>
      ) : (
        incomeSources.map((src, idx) => (
          <div key={src.id} className="income-item">
            <div className={`income-icon ${idx < 2 ? 'regular' : 'extra'}`}>
              {idx === 0 ? '👤' : idx === 1 ? '👤' : '⭐'}
            </div>
            <div className="income-info">
              <div className="income-label">{src.name}</div>
              <div className="income-sub">{idx >= 2 ? 'Ingreso extra' : 'Sueldo mensual'}</div>
            </div>
            <div className="income-amount">{fmt(src.amount)}</div>
          </div>
        ))
      )}

      {incomeSources.length > 0 && (
        <div className="income-total-row">
          <span className="income-total-label">Total ingresos</span>
          <span className="income-total-val">{fmt(totalIncome)}</span>
        </div>
      )}

      <button
        className="add-dashed-btn"
        style={{ borderColor: '#bbf7d0', color: '#059669' }}
        onClick={onEditIncome}
      >
        ✏️ Editar ingresos
      </button>

      {/* Savings summary */}
      <div className="savings-card">
        <div className="savings-card-header">
          <span className="savings-card-title">🏦 Ahorro acumulado</span>
          <button className="savings-edit-btn" onClick={onEditSavings}>Editar</button>
        </div>
        <div className="savings-main">{fmt(savings)}</div>
        <div className="savings-breakdown">
          <div className="savings-row">
            <span className="savings-row-label">Saldo este mes</span>
            <span className="savings-row-val" style={{ color: quedaMes >= 0 ? '#059669' : '#ef4444' }}>
              {fmt(quedaMes)}
            </span>
          </div>
          <hr className="savings-divider" />
          <div className="savings-row">
            <span className="savings-row-label">Si sumás el saldo del mes</span>
            <span className="savings-row-val">{fmt(savings + Math.max(0, quedaMes))}</span>
          </div>
        </div>
      </div>
    </>
  )
}
