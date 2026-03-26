import { useState } from 'react'
import { toFloat, fmt } from '../../utils'

export default function SavingsModal({ savings, quedaMes, onClose, onSave }) {
  const [val, setVal] = useState(String(savings))

  const save = () => {
    onSave(toFloat(val))
    onClose()
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle" />
        <div className="modal-title">🏦 Ahorro acumulado</div>
        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20, lineHeight: 1.5 }}>
          Este es el total de ahorros que tienen hasta la fecha. Actualizalo manualmente cuando quieras.
        </p>

        <div className="form-group">
          <label className="form-label">Ahorros totales actuales (€)</label>
          <input
            className="form-input big purple"
            type="number"
            inputMode="decimal"
            value={val}
            onChange={e => setVal(e.target.value)}
            placeholder="0,00"
            autoFocus
          />
        </div>

        {quedaMes !== null && (
          <div style={{ background: '#f5f3ff', borderRadius: 13, padding: '12px 14px', marginBottom: 4 }}>
            <div style={{ fontSize: 12, color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>
              Referencia este mes
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: '#64748b' }}>Saldo que queda este mes</span>
              <span style={{ fontWeight: 700, color: quedaMes >= 0 ? '#059669' : '#ef4444' }}>
                {fmt(quedaMes)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginTop: 6 }}>
              <span style={{ color: '#64748b' }}>Si sumás el saldo</span>
              <span style={{ fontWeight: 700, color: '#7c3aed' }}>
                {fmt(toFloat(val) + Math.max(0, quedaMes))}
              </span>
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-save" onClick={save}>Guardar</button>
        </div>
      </div>
    </div>
  )
}
