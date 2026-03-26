import { useState, useEffect, useCallback } from 'react'
import { MONTHS } from './constants'
import { newId, mkKey, todayStr } from './utils'
import { useStorage } from './hooks/useStorage'
import { DEFAULT_FIXED, MARZO_2026 } from './data/initialData'

import SummaryCard from './components/SummaryCard'
import VariablesTab from './components/tabs/VariablesTab'
import FijosTab from './components/tabs/FijosTab'
import IngresosTab from './components/tabs/IngresosTab'
import AddModal from './components/modals/AddModal'
import FixedModal from './components/modals/FixedModal'
import IncomeModal from './components/modals/IncomeModal'
import SavingsModal from './components/modals/SavingsModal'

export default function App() {
  const today = new Date()
  const [curYear,  setCurYear]  = useState(today.getFullYear())
  const [curMonth, setCurMonth] = useState(today.getMonth())
  const [tab, setTab] = useState('variables')

  // Modal state
  const [showAdd,     setShowAdd]     = useState(false)
  const [editExp,     setEditExp]     = useState(null)
  const [editFixed,   setEditFixed]   = useState(null)
  const [addFixed,    setAddFixed]    = useState(false)
  const [showIncome,  setShowIncome]  = useState(false)
  const [showSavings, setShowSavings] = useState(false)

  // Persisted data
  const [fixedExpenses, setFixedExpenses] = useStorage('gastos-fixed', DEFAULT_FIXED)
  const [monthsData, setMonthsData] = useStorage('gastos-months', {
    '2026-2': {
      incomeSources: [
        { id: 'i1', name: 'Sueldo Joako',  amount: 1553.33 },
        { id: 'i2', name: 'Sueldo Esposa', amount: 1553.33 },
      ],
      savings: 3507.23,
      expenses: MARZO_2026,
    },
  })

  // Current month data
  const key = mkKey(curYear, curMonth)
  const md  = monthsData[key] || { incomeSources: [], savings: 0, expenses: [] }

  const totalFixed  = fixedExpenses.reduce((s, e) => s + e.amount, 0)
  const totalVar    = md.expenses.reduce((s, e) => s + e.amount, 0)
  const totalIncome = (md.incomeSources || []).reduce((s, i) => s + i.amount, 0)
  const quedaMes    = totalIncome - totalFixed - totalVar

  // Handle URL params (for iOS Shortcuts / Android automation)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const amt  = p.get('amount')
    const name = p.get('name')
    const cat  = p.get('cat')
    if (amt) {
      setEditExp({ name: name || '', amount: parseFloat(amt) || 0, category: cat || 'otros', _auto: true })
      setShowAdd(true)
    }
  }, [])

  const updateMd = useCallback(patch => {
    setMonthsData(prev => ({ ...prev, [key]: { ...md, ...patch } }))
  }, [key, md, setMonthsData])

  // Navigation
  const prevMonth = () => {
    if (curMonth === 0) { setCurMonth(11); setCurYear(y => y - 1) }
    else setCurMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (curMonth === 11) { setCurMonth(0); setCurYear(y => y + 1) }
    else setCurMonth(m => m + 1)
  }

  // Variable expense CRUD
  const addExpense  = exp  => updateMd({ expenses: [{ ...exp, id: newId() }, ...md.expenses] })
  const saveEditExp = upd  => updateMd({ expenses: md.expenses.map(e => e.id === upd.id ? { ...e, ...upd } : e) })
  const delExpense  = id   => updateMd({ expenses: md.expenses.filter(e => e.id !== id) })

  // Fixed expense CRUD
  const saveFixed = exp => setFixedExpenses(prev => {
    const idx = prev.findIndex(e => e.id === exp.id)
    return idx === -1 ? [...prev, exp] : prev.map(e => e.id === exp.id ? exp : e)
  })
  const delFixed = id => setFixedExpenses(prev => prev.filter(e => e.id !== id))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* ── HEADER ── */}
      <div className="header">
        <div className="header-top">
          <div className="month-nav">
            <button className="nav-btn" onClick={prevMonth}>‹</button>
            <div className="month-title">{MONTHS[curMonth]} {curYear}</div>
            <button className="nav-btn" onClick={nextMonth}>›</button>
          </div>
          <div className="header-actions">
            <button className="icon-btn" title="Ingresos" onClick={() => setShowIncome(true)}>💰</button>
            <button className="icon-btn" title="Ahorro"   onClick={() => setShowSavings(true)}>🏦</button>
          </div>
        </div>

        <SummaryCard
          totalIncome={totalIncome}
          totalVar={totalVar}
          totalFixed={totalFixed}
          savings={md.savings}
          quedaMes={quedaMes}
        />

        <div className="tabs-bar">
          <button className={`tab-btn ${tab === 'variables' ? 'active' : 'inactive'}`} onClick={() => setTab('variables')}>
            📊 Variables ({md.expenses.length})
          </button>
          <button className={`tab-btn ${tab === 'fijos' ? 'active' : 'inactive'}`} onClick={() => setTab('fijos')}>
            📌 Fijos ({fixedExpenses.length})
          </button>
          <button className={`tab-btn ${tab === 'ingresos' ? 'active' : 'inactive'}`} onClick={() => setTab('ingresos')}>
            💰 Ingresos
          </button>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="content">
        {tab === 'variables' && (
          <VariablesTab
            expenses={md.expenses}
            totalVar={totalVar}
            onDelete={delExpense}
            onEdit={exp => { setEditExp(exp); setShowAdd(true) }}
          />
        )}
        {tab === 'fijos' && (
          <FijosTab
            fixedExpenses={fixedExpenses}
            totalFixed={totalFixed}
            onEdit={setEditFixed}
            onAdd={() => setAddFixed(true)}
          />
        )}
        {tab === 'ingresos' && (
          <IngresosTab
            incomeSources={md.incomeSources || []}
            totalIncome={totalIncome}
            quedaMes={quedaMes}
            savings={md.savings}
            onEditIncome={() => setShowIncome(true)}
            onEditSavings={() => setShowSavings(true)}
          />
        )}
      </div>

      {/* ── FAB ── */}
      {tab === 'variables' && (
        <button className="fab" onClick={() => { setEditExp(null); setShowAdd(true) }}>
          + Añadir gasto
        </button>
      )}
      {tab === 'fijos' && (
        <button className="fab" onClick={() => setAddFixed(true)}>
          + Añadir fijo
        </button>
      )}
      {tab === 'ingresos' && (
        <button className="fab" onClick={() => setShowIncome(true)}>
          💰 Editar ingresos
        </button>
      )}

      {/* ── MODALS ── */}
      {showAdd && (
        <AddModal
          initial={editExp}
          onClose={() => { setShowAdd(false); setEditExp(null) }}
          onSave={exp => {
            if (editExp && !editExp._auto) saveEditExp({ ...editExp, ...exp })
            else addExpense(exp)
          }}
        />
      )}
      {(editFixed || addFixed) && (
        <FixedModal
          expense={addFixed ? null : editFixed}
          onClose={() => { setEditFixed(null); setAddFixed(false) }}
          onSave={saveFixed}
          onDelete={delFixed}
        />
      )}
      {showIncome && (
        <IncomeModal
          sources={md.incomeSources || []}
          onClose={() => setShowIncome(false)}
          onSave={src => updateMd({ incomeSources: src })}
        />
      )}
      {showSavings && (
        <SavingsModal
          savings={md.savings}
          quedaMes={quedaMes}
          onClose={() => setShowSavings(false)}
          onSave={s => updateMd({ savings: s })}
        />
      )}
    </div>
  )
}
