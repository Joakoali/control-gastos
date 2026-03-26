import { useState } from 'react'
import { CAT_MAP } from '../../constants'
import { fmt } from '../../utils'

const fmtDate = d => {
  if (!d) return ''
  const [, m, day] = d.split('-')
  return `${day}/${m}`
}

function ExpenseItem({ expense, onDelete, onEdit }) {
  const cat = CAT_MAP[expense.category] || CAT_MAP.otros
  return (
    <div className="expense-item" onClick={() => onEdit(expense)}>
      <div className={`expense-emoji bg-${cat.id}`}>{cat.emoji}</div>
      <div className="expense-info">
        <div className="expense-name">{expense.name}</div>
        <div className="expense-cat">
          {cat.label} · {fmtDate(expense.date)}
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
  const [sortDir, setSortDir] = useState('desc') // desc = más reciente primero

  const sorted = [...expenses].sort((a, b) => {
    const da = a.date || ''
    const db = b.date || ''
    return sortDir === 'desc' ? db.localeCompare(da) : da.localeCompare(db)
  })

  return (
    <>
      <div className="section-header">
        <span className="section-title">Gastos variables</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
            style={{
              background: '#f1f5f9', border: 'none', borderRadius: 8,
              padding: '4px 10px', fontSize: 12, fontWeight: 600,
              color: '#64748b', cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: 4,
            }}
            title="Ordenar por fecha"
          >
            {sortDir === 'desc' ? '↓ Reciente' : '↑ Antiguo'}
          </button>
          <span className="section-total">{fmt(totalVar)}</span>
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🧾</div>
          <div className="empty-title">Sin gastos este mes</div>
          <div className="empty-sub">Pulsá el botón de abajo para añadir</div>
        </div>
      ) : (
        sorted.map(e => (
          <ExpenseItem key={e.id} expense={e} onDelete={onDelete} onEdit={onEdit} />
        ))
      )}
    </>
  )
}
