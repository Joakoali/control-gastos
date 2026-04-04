import { useState, useEffect } from 'react'
import { MONTHS } from './constants'
import { newId, mkKey } from './utils'
import { useAuth } from './hooks/useAuth'
import { useHousehold } from './hooks/useHousehold'
import type { TabType, Expense, FixedExpense, IncomeSource } from './types'

import LoginScreen    from './components/LoginScreen'
import HouseholdSetup from './components/HouseholdSetup'
import SummaryCard    from './components/SummaryCard'
import VariablesTab   from './components/tabs/VariablesTab'
import FijosTab       from './components/tabs/FijosTab'
import IngresosTab    from './components/tabs/IngresosTab'
import AddModal       from './components/modals/AddModal'
import FixedModal     from './components/modals/FixedModal'
import IncomeModal    from './components/modals/IncomeModal'
import SavingsModal   from './components/modals/SavingsModal'

export default function App() {
  const { user, loading: authLoading, loginWithGoogle, logout } = useAuth()
  const { householdId, householdData, loadingHH, createHousehold, joinHousehold, updateMonth, updateMonthFixed, importHistoricalData } = useHousehold(user)

  const today = new Date()
  const [curYear,  setCurYear]  = useState(today.getFullYear())
  const [curMonth, setCurMonth] = useState(today.getMonth())
  const [tab,      setTab]      = useState<TabType>('variables')
  const [loginError, setLoginError] = useState('')

  const [importing,   setImporting]   = useState(false)
  const [importMsg,   setImportMsg]   = useState('')
  const [showAdd,     setShowAdd]     = useState(false)
  const [editExp,     setEditExp]     = useState<Partial<Expense> | null>(null)
  const [editFixed,   setEditFixed]   = useState<FixedExpense | null>(null)
  const [addFixed,    setAddFixed]    = useState(false)
  const [showIncome,  setShowIncome]  = useState(false)
  const [showSavings, setShowSavings] = useState(false)
  const [showCode,    setShowCode]    = useState(false)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const amt = p.get('amount'), name = p.get('name'), cat = p.get('cat')
    if (amt) {
      setEditExp({ name: name || '', amount: parseFloat(amt) || 0, category: cat || 'otros', _auto: true })
      setShowAdd(true)
    }
  }, [])

  const anyModalOpen = showAdd || showIncome || showSavings || showCode || !!editFixed || addFixed

  useEffect(() => {
    window.history.replaceState({ type: 'app-root' }, '')
    window.history.pushState({ type: 'app-guard' }, '')
  }, [])

  useEffect(() => {
    if (anyModalOpen) window.history.pushState({ type: 'modal' }, '')
  }, [anyModalOpen])

  useEffect(() => {
    const onBack = () => {
      if (showAdd)               { setShowAdd(false); setEditExp(null); return }
      if (showIncome)            { setShowIncome(false); return }
      if (showSavings)           { setShowSavings(false); return }
      if (editFixed || addFixed) { setEditFixed(null); setAddFixed(false); return }
      if (showCode)              { setShowCode(false); return }
      window.history.pushState({ type: 'app-guard' }, '')
    }
    window.addEventListener('popstate', onBack)
    return () => window.removeEventListener('popstate', onBack)
  }, [showAdd, showIncome, showSavings, editFixed, addFixed, showCode])

  if (authLoading || loadingHH) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 to-violet-600 gap-4">
        <div className="text-[48px]">💰</div>
        <div className="text-white/80 text-[16px]">Cargando...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <LoginScreen
        onLogin={async () => {
          try { await loginWithGoogle() }
          catch { setLoginError('Error al iniciar sesión. Intentá de nuevo.') }
        }}
        error={loginError}
      />
    )
  }

  if (!householdId) {
    return <HouseholdSetup user={user} onCreate={createHousehold} onJoin={joinHousehold} />
  }

  const key  = mkKey(curYear, curMonth)
  const md   = householdData?.months?.[key] || { incomeSources: [], savings: 0, expenses: [] }

  const prevMonthKey     = curMonth === 0 ? mkKey(curYear - 1, 11) : mkKey(curYear, curMonth - 1)
  const prevMonthSources = (householdData?.months?.[prevMonthKey]?.incomeSources || []) as IncomeSource[]
  const fixedExpenses  = (md.fixedExpenses ?? householdData?.fixedExpenses ?? []) as FixedExpense[]
  const prevMonthFixed = (householdData?.months?.[prevMonthKey]?.fixedExpenses ?? householdData?.fixedExpenses ?? []) as FixedExpense[]

  const totalFixed  = fixedExpenses.reduce((s, e) => s + e.amount, 0)
  const totalVar    = md.expenses.reduce((s, e) => s + e.amount, 0)
  const totalIncome = (md.incomeSources || []).reduce((s, i) => s + Number(i.amount), 0)
  const quedaMes    = totalIncome - totalFixed - totalVar

  const doUpdateMonth = (patch: object) => updateMonth(key, patch)

  const prevMonth = () => { if (curMonth === 0) { setCurMonth(11); setCurYear(y => y - 1) } else setCurMonth(m => m - 1) }
  const nextMonth = () => { if (curMonth === 11) { setCurMonth(0); setCurYear(y => y + 1) } else setCurMonth(m => m + 1) }

  const addExpense  = (exp: Omit<Expense, 'id'>) => doUpdateMonth({ expenses: [{ ...exp, id: newId() }, ...md.expenses] })
  const saveEditExp = (upd: Expense) => doUpdateMonth({ expenses: md.expenses.map(e => e.id === upd.id ? { ...e, ...upd } : e) })
  const delExpense  = (id: string | number) => doUpdateMonth({ expenses: md.expenses.filter(e => e.id !== id) })

  const saveFixed  = (exp: FixedExpense) => {
    const idx     = fixedExpenses.findIndex(e => e.id === exp.id)
    const updated = idx === -1 ? [...fixedExpenses, exp] : fixedExpenses.map(e => e.id === exp.id ? exp : e)
    updateMonthFixed(key, updated)
  }
  const delFixed   = (id: string | number) => updateMonthFixed(key, fixedExpenses.filter(e => e.id !== id))
  const copyFixed  = () => updateMonthFixed(key, prevMonthFixed.map(e => ({ ...e, id: newId() })))

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 px-4 pt-[52px] sticky top-0 z-40 shadow-[0_4px_24px_rgba(79,70,229,0.35)]">
        <div className="flex items-center justify-between mb-[14px]">
          <div className="flex items-center gap-[10px]">
            <button className="bg-white/[0.18] border-none rounded-full w-[34px] h-[34px] text-white text-[18px] cursor-pointer flex items-center justify-center active:bg-white/30" onClick={prevMonth}>‹</button>
            <div className="text-white text-[20px] font-bold tracking-[-0.3px]">{MONTHS[curMonth]} {curYear}</div>
            <button className="bg-white/[0.18] border-none rounded-full w-[34px] h-[34px] text-white text-[18px] cursor-pointer flex items-center justify-center active:bg-white/30" onClick={nextMonth}>›</button>
          </div>
          <div className="flex gap-2">
            <button className="bg-white/[0.18] border-none rounded-full w-[34px] h-[34px] text-white text-[17px] cursor-pointer flex items-center justify-center" title="Ahorro" onClick={() => setShowSavings(true)}>🏦</button>
            <button className="bg-white/[0.18] border-none rounded-full w-[34px] h-[34px] text-white text-[17px] cursor-pointer flex items-center justify-center" title="Cuenta" onClick={() => setShowCode(true)}>👤</button>
          </div>
        </div>
        <SummaryCard totalIncome={totalIncome} totalVar={totalVar} totalFixed={totalFixed} savings={md.savings} quedaMes={quedaMes} activeTab={tab} onTabChange={setTab} />
      </div>

      {/* Content */}
      <div className="flex-1 p-3 pb-[110px] flex flex-col gap-2">
        {tab === 'variables' && <VariablesTab expenses={md.expenses as Expense[]} totalVar={totalVar} onDelete={delExpense} onEdit={exp => { setEditExp(exp); setShowAdd(true) }} />}
        {tab === 'fijos'     && <FijosTab fixedExpenses={fixedExpenses} totalFixed={totalFixed} onEdit={setEditFixed} onAdd={() => setAddFixed(true)} prevFixedExpenses={prevMonthFixed} onCopyFromPrev={copyFixed} />}
        {tab === 'ingresos'  && <IngresosTab incomeSources={md.incomeSources || []} totalIncome={totalIncome} quedaMes={quedaMes} savings={md.savings} onEditIncome={() => setShowIncome(true)} onEditSavings={() => setShowSavings(true)} />}
      </div>

      {/* FAB */}
      {tab === 'variables' && <button className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gradient-to-br from-indigo-600 to-violet-600 text-white border-none rounded-[26px] py-[15px] px-7 text-[16px] font-bold cursor-pointer shadow-[0_8px_24px_rgba(79,70,229,0.45)] flex items-center gap-[9px] z-30 max-w-[340px] w-[calc(100%-48px)] justify-center whitespace-nowrap active:opacity-90" onClick={() => { setEditExp(null); setShowAdd(true) }}>+ Añadir gasto</button>}
      {tab === 'fijos'     && <button className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gradient-to-br from-indigo-600 to-violet-600 text-white border-none rounded-[26px] py-[15px] px-7 text-[16px] font-bold cursor-pointer shadow-[0_8px_24px_rgba(79,70,229,0.45)] flex items-center gap-[9px] z-30 max-w-[340px] w-[calc(100%-48px)] justify-center whitespace-nowrap active:opacity-90" onClick={() => setAddFixed(true)}>+ Añadir fijo</button>}

      {/* Modals */}
      {showAdd && (
        <AddModal initial={editExp} onClose={() => { setShowAdd(false); setEditExp(null) }}
          onSave={exp => { if (editExp && !editExp._auto) saveEditExp({ ...editExp, ...exp } as Expense); else addExpense(exp) }} />
      )}
      {(editFixed || addFixed) && (
        <FixedModal expense={addFixed ? null : editFixed} onClose={() => { setEditFixed(null); setAddFixed(false) }} onSave={saveFixed} onDelete={delFixed} />
      )}
      {showIncome && (
        <IncomeModal sources={(md.incomeSources || []) as IncomeSource[]} prevSources={prevMonthSources}
          onClose={() => setShowIncome(false)} onSave={src => doUpdateMonth({ incomeSources: src })} />
      )}
      {showSavings && (
        <SavingsModal savings={md.savings} quedaMes={quedaMes} onClose={() => setShowSavings(false)} onSave={s => doUpdateMonth({ savings: s })} />
      )}

      {/* Account modal */}
      {showCode && (
        <div className="fixed inset-0 bg-[rgba(15,10,40,0.6)] z-50 flex items-end backdrop-blur-[4px]" onClick={e => e.target === e.currentTarget && setShowCode(false)}>
          <div className="bg-white rounded-[28px_28px_0_0] w-full max-w-[480px] mx-auto p-[20px_20px_44px]">
            <div className="w-9 h-1 bg-slate-200 rounded-[2px] mx-auto mb-[18px]" />
            <div className="text-[21px] font-extrabold text-[#1e1b4b] mb-[18px]">👤 Mi cuenta</div>

            <div className="bg-slate-50 rounded-[14px] p-4 mb-4">
              <div className="text-[13px] text-slate-400 font-bold uppercase tracking-[0.4px] mb-[6px]">Sesión activa</div>
              <div className="text-[15px] font-semibold text-[#1e1b4b]">{user.displayName}</div>
              <div className="text-[13px] text-slate-500">{user.email}</div>
            </div>

            <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-[14px] p-4 mb-6 text-center">
              <div className="text-[13px] text-violet-700 font-bold uppercase tracking-[0.4px] mb-2">Código de tu hogar</div>
              <div className="text-[36px] font-extrabold text-[#4c1d95] tracking-[8px]">{householdId}</div>
              <div className="text-[12px] text-violet-700 mt-[6px]">Compartí este código para que tu pareja pueda unirse</div>
            </div>

            <button
              onClick={async () => {
                setImporting(true); setImportMsg('')
                try {
                  const n = await importHistoricalData()
                  setImportMsg(n > 0 ? `✅ ${n} meses importados correctamente` : '✅ Los datos ya estaban cargados')
                } catch { setImportMsg('❌ Error al importar. Intentá de nuevo.') }
                setImporting(false)
              }}
              disabled={importing}
              className="w-full py-[15px] border-none rounded-[13px] bg-violet-100 text-violet-700 text-[15px] font-bold cursor-pointer mb-[10px] disabled:opacity-60"
            >
              {importing ? 'Importando...' : '📂 Importar datos históricos'}
            </button>
            {importMsg && <div className={`text-center text-[13px] mb-3 ${importMsg.startsWith('✅') ? 'text-emerald-600' : 'text-red-500'}`}>{importMsg}</div>}

            <button onClick={() => { logout(); setShowCode(false) }} className="w-full py-[15px] border-none rounded-[13px] bg-red-100 text-red-500 text-[15px] font-bold cursor-pointer">
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
