import { useState } from 'react'
import { toFloat, newId } from '../../utils'

export default function FixedModal({ expense, onClose, onSave, onDelete }) {
  const [name, setName] = useState(expense?.name || '')
  const [amt,  setAmt]  = useState(expense?.amount ? String(expense.amount) : '')
  const isNew = !expense?.id

  const save = () => {
    const a = toFloat(amt)
    if (!name.trim() || a <= 0) return
    onSave({ ...(expense || {}), id: expense?.id || newId(), name: name.trim(), amount: a })
    onClose()
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle" />
        <div className="modal-title">{isNew ? '+ Gasto fijo' : '✏️ Editar fijo'}</div>

        <div className="form-group">
          <label className="form-label">Nombre</label>
          <input
            className="form-input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ej: Netflix"
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">Importe mensual (€)</label>
          <input
            className="form-input big"
            type="number"
            inputMode="decimal"
            value={amt}
            onChange={e => setAmt(e.target.value)}
            placeholder="0,00"
          />
        </div>

        <div className="modal-actions">
          {!isNew && (
            <button className="btn-danger" onClick={() => { onDelete(expense.id); onClose() }}>
              Eliminar
            </button>
          )}
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-save" onClick={save}>Guardar</button>
        </div>
      </div>
    </div>
  )
}
