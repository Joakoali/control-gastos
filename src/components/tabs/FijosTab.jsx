import { fixedIcon } from '../../constants'
import { fmt } from '../../utils'

export default function FijosTab({ fixedExpenses, totalFixed, onEdit, onAdd }) {
  return (
    <>
      <div className="section-header">
        <span className="section-title">Gastos fijos mensuales</span>
        <span className="section-total">{fmt(totalFixed)}</span>
      </div>

      {fixedExpenses.map(e => (
        <div key={e.id} className="fixed-item">
          <div className="fixed-icon">{fixedIcon(e.name)}</div>
          <div className="fixed-info">
            <div className="fixed-name">{e.name}</div>
            <div className="fixed-sub">Se repite cada mes</div>
          </div>
          <div className="fixed-amount">{fmt(e.amount)}</div>
          <button className="fixed-edit" onClick={() => onEdit(e)}>✎</button>
        </div>
      ))}

      <button className="add-dashed-btn" onClick={onAdd}>
        + Añadir gasto fijo
      </button>
    </>
  )
}
