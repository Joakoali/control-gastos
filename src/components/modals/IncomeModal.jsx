import { useState } from 'react'
import { toFloat, newId } from '../../utils'
import { fmt } from '../../utils'

export default function IncomeModal({ sources, prevSources = [], onClose, onSave }) {
  const [items, setItems] = useState(
    sources.length > 0
      ? sources.map(s => ({ ...s }))
      : [
          { id: 'i1', name: 'Sueldo Joako',  amount: '' },
          { id: 'i2', name: 'Sueldo Esposa', amount: '' },
        ]
  )
  const [copied, setCopied] = useState(false)

  const copyFromPrev = () => {
    if (prevSources.length === 0) return
    setItems(prevSources.map(s => ({ ...s, id: newId() })))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const update = (id, field, val) =>
    setItems(prev => prev.map(i => (i.id === id ? { ...i, [field]: val } : i)))

  const remove = id => setItems(prev => prev.filter(i => i.id !== id))

  const add = () =>
    setItems(prev => [...prev, { id: newId(), name: 'Extra / Ingreso', amount: '' }])

  const save = () => {
    const cleaned = items
      .map(i => ({ ...i, amount: toFloat(i.amount), name: i.name.trim() || 'Ingreso' }))
      .filter(i => i.amount > 0)
    onSave(cleaned)
    onClose()
  }

  const total = items.reduce((s, i) => s + toFloat(i.amount), 0)

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle" />
        <div className="modal-title">💰 Ingresos del mes</div>
        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>
          Añadí sueldos, extras, comisiones o cualquier ingreso de este mes.
        </p>

        {prevSources.length > 0 && (
          <button
            onClick={copyFromPrev}
            style={{
              width: '100%', padding: '10px 14px', marginBottom: 14,
              border: '2px dashed #c4b5fd', borderRadius: 12,
              background: copied ? '#f0fdf4' : '#faf5ff',
              color: copied ? '#059669' : '#7c3aed',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s',
            }}
          >
            {copied ? '✅ Copiado!' : '📋 Copiar sueldos del mes anterior'}
          </button>
        )}

        {items.map((item, idx) => (
          <div key={item.id} className="income-source-row">
            <span className="income-source-icon">
              {idx === 0 ? '👤' : idx === 1 ? '👤' : '⭐'}
            </span>
            <div className="income-source-inputs">
              <input
                className="form-input"
                style={{ padding: '8px 10px', fontSize: 14, marginBottom: 6 }}
                value={item.name}
                onChange={e => update(item.id, 'name', e.target.value)}
                placeholder="Nombre del ingreso"
              />
              <input
                className="income-source-input"
                type="number"
                inputMode="decimal"
                value={item.amount}
                onChange={e => update(item.id, 'amount', e.target.value)}
                placeholder="0,00"
              />
            </div>
            {items.length > 1 && (
              <button className="income-source-del" onClick={() => remove(item.id)}>×</button>
            )}
          </div>
        ))}

        <button className="add-income-btn" onClick={add}>+ Añadir ingreso / extra</button>

        <div style={{ background: '#f0fdf4', borderRadius: 13, padding: '12px 14px', marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#065f46' }}>Total ingresos</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#059669' }}>{fmt(total)}</span>
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
