import { CAT_MAP } from '../../constants'
import { fmt } from '../../utils'

function ExpenseItem({ expense, onDelete, onEdit }) {
  const cat = CAT_MAP[expense.category] || CAT_MAP.otros
  return (
    <div className="expense-item" onClick={() => onEdit(expense)}>
      <div className={`expense-emoji bg-${cat.id}`}>{cat.emoji}</div>
      <div className="expense-info">
        <div className="expense-name">{expense.name}</div>
        <div className="expense-cat">
          {cat.label} · {expense.date?.slice(5).replace('-', '/')}
        </div>
      </div>
      <div className="expense-amount">{fmt(expense.amount)}</div>
      <button
        className="expense-del"
        onClick={e => { e.stopPropagation(); onDelete(expense.id) }}
      >
        ×
      </button>
    </div>
  )
}

export default function VariablesTab({ expenses, totalVar, onDelete, onEdit }) {
  return (
    <>
      <div className="section-header">
        <span className="section-title">Gastos variables</span>
        <span className="section-total">{fmt(totalVar)}</span>
      </div>

      {expenses.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🧾</div>
          <div className="empty-title">Sin gastos este mes</div>
          <div className="empty-sub">Pulsá el botón de abajo para añadir</div>
        </div>
      ) : (
        expenses.map(e => (
          <ExpenseItem key={e.id} expense={e} onDelete={onDelete} onEdit={onEdit} />
        ))
      )}
    </>
  )
}
