import { useState, useRef, useEffect } from 'react'
import { CATS } from '../../constants'
import { toFloat, todayStr } from '../../utils'

export default function AddModal({ initial, onClose, onSave }) {
  const [name, setName] = useState(initial?.name || '')
  const [amt,  setAmt]  = useState(initial?.amount ? String(initial.amount) : '')
  const [cat,  setCat]  = useState(initial?.category || 'otros')
  const nameRef = useRef()

  useEffect(() => { setTimeout(() => nameRef.current?.focus(), 300) }, [])

  const save = () => {
    const a = toFloat(amt)
    if (!name.trim() || a <= 0) return
    onSave({ name: name.trim(), amount: a, category: cat, date: todayStr() })
    onClose()
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle" />
        <div className="modal-title">{initial ? '✏️ Editar gasto' : '+ Añadir gasto'}</div>

        <div className="form-group">
          <label className="form-label">Descripción</label>
          <input
            ref={nameRef}
            className="form-input"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
            placeholder="Ej: Mercadona"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Importe (€)</label>
          <input
            className="form-input big"
            type="number"
            inputMode="decimal"
            value={amt}
            onChange={e => setAmt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
            placeholder="0,00"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Categoría</label>
          <div className="cat-grid">
            {CATS.map(c => (
              <button
                key={c.id}
                className={`cat-btn ${cat === c.id ? 'sel' : ''}`}
                onClick={() => setCat(c.id)}
              >
                <span className="cat-emoji">{c.emoji}</span>
                <span className="cat-label">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-save" onClick={save}>Guardar</button>
        </div>
      </div>
    </div>
  )
}
