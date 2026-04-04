# Gastos Fijos por Mes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mover los gastos fijos de globales a por-mes, con migración lazy y botón para copiar del mes anterior.

**Architecture:** `fixedExpenses` pasa de `HouseholdData` root a `MonthData`. El fallback `md.fixedExpenses ?? householdData?.fixedExpenses ?? []` garantiza compatibilidad con meses viejos sin migración upfront. Cada escritura guarda en `months.KEY.fixedExpenses`, haciendo el mes independiente.

**Tech Stack:** React 18, TypeScript, Firebase Firestore, Tailwind CSS, Vite

---

## File Map

| Archivo | Cambio |
|---|---|
| `src/utils.ts` | Eliminar `todayStr` (código muerto) |
| `src/types.ts` | Agregar `fixedExpenses?: FixedExpense[]` a `MonthData` |
| `src/hooks/useHousehold.ts` | Reemplazar `updateFixed` por `updateMonthFixed` |
| `src/App.tsx` | Nuevo fallback, `saveFixed`/`delFixed`/`copyFixed` usan `updateMonthFixed` |
| `src/components/tabs/FijosTab.tsx` | Agregar botón "Copiar fijos del mes anterior" |

---

## Task 1: Eliminar código muerto en utils.ts

**Files:**
- Modify: `src/utils.ts`

- [ ] **Step 1: Eliminar `todayStr`**

Abrir `src/utils.ts`. El archivo completo debe quedar así:

```ts
export const fmt = (n: number): string =>
  n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'

export const toFloat = (s: string | number): number =>
  parseFloat(String(s).replace(',', '.')) || 0

export const newId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2)}`

export const mkKey = (year: number, month: number): string => `${year}-${month}`
```

- [ ] **Step 2: Verificar que nada importe `todayStr`**

Buscar en el proyecto:
```
grep -r "todayStr" src/
```
Esperado: sin resultados.

- [ ] **Step 3: Commit**

```bash
git add src/utils.ts
git commit -m "chore: remove unused todayStr export"
```

---

## Task 2: Actualizar tipos — agregar fixedExpenses a MonthData

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Agregar el campo opcional a MonthData**

Abrir `src/types.ts`. El archivo completo debe quedar así:

```ts
export interface Expense {
  id: string | number
  name: string
  amount: number
  category: string
  date: string
  _auto?: boolean
}

export interface FixedExpense {
  id: string | number
  name: string
  amount: number
}

export interface IncomeSource {
  id: string | number
  name: string
  amount: number | string
}

export interface MonthData {
  incomeSources: IncomeSource[]
  savings: number
  expenses: Expense[]
  fixedExpenses?: FixedExpense[]
}

export interface HouseholdData {
  code: string
  members: string[]
  createdBy: string
  fixedExpenses: FixedExpense[]
  months: Record<string, MonthData>
}

export type TabType = 'variables' | 'fijos' | 'ingresos'

export interface Category {
  id: string
  label: string
  emoji: string
}
```

Nota: `HouseholdData.fixedExpenses` se mantiene en el tipo como campo legacy — existe en Firebase y lo usamos para el fallback de migración.

- [ ] **Step 2: Verificar que TypeScript no rompe**

```bash
npx tsc --noEmit
```
Esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add fixedExpenses to MonthData type for per-month storage"
```

---

## Task 3: Reemplazar updateFixed por updateMonthFixed en useHousehold

**Files:**
- Modify: `src/hooks/useHousehold.ts`

- [ ] **Step 1: Reemplazar la función**

Abrir `src/hooks/useHousehold.ts`. Reemplazar la función `updateFixed`:

```ts
// ANTES:
const updateFixed = useCallback(async (fixedExpenses: FixedExpense[]) => {
  if (!householdId) return
  await updateDoc(doc(db, 'households', householdId), { fixedExpenses })
}, [householdId])
```

Por:

```ts
// DESPUÉS:
const updateMonthFixed = useCallback(async (key: string, fixedExpenses: FixedExpense[]) => {
  if (!householdId) return
  await updateDoc(doc(db, 'households', householdId), {
    [`months.${key}`]: {
      ...(householdData?.months?.[key] || { incomeSources: [], savings: 0, expenses: [] }),
      fixedExpenses,
    },
  })
}, [householdId, householdData])
```

- [ ] **Step 2: Actualizar el return del hook**

Al final del archivo, cambiar el return para exponer `updateMonthFixed` en lugar de `updateFixed`:

```ts
return { householdId, householdData, loadingHH, createHousehold, joinHousehold, updateMonth, updateMonthFixed, importHistoricalData }
```

- [ ] **Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit
```
Esperado: error en `App.tsx` porque `updateFixed` ya no existe (se corrige en Task 4).

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useHousehold.ts
git commit -m "feat: replace updateFixed with updateMonthFixed for per-month fixed expenses"
```

---

## Task 4: Actualizar App.tsx — lógica de fijos por mes

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Actualizar el destructuring de useHousehold**

Línea 21, cambiar `updateFixed` por `updateMonthFixed`:

```ts
const { householdId, householdData, loadingHH, createHousehold, joinHousehold, updateMonth, updateMonthFixed, importHistoricalData } = useHousehold(user)
```

- [ ] **Step 2: Actualizar la resolución de fixedExpenses y agregar prevMonthFixed**

Después de la línea:
```ts
const prevMonthSources = (householdData?.months?.[prevMonthKey]?.incomeSources || []) as IncomeSource[]
```

Reemplazar:
```ts
const fixedExpenses    = householdData?.fixedExpenses || []
```

Por:
```ts
const fixedExpenses  = (md.fixedExpenses ?? householdData?.fixedExpenses ?? []) as FixedExpense[]
const prevMonthFixed = (householdData?.months?.[prevMonthKey]?.fixedExpenses ?? householdData?.fixedExpenses ?? []) as FixedExpense[]
```

- [ ] **Step 3: Actualizar saveFixed, delFixed y agregar copyFixed**

Reemplazar las funciones `saveFixed` y `delFixed`:

```ts
// ANTES:
const saveFixed = (exp: FixedExpense) => {
  const idx     = fixedExpenses.findIndex(e => e.id === exp.id)
  const updated = idx === -1 ? [...fixedExpenses, exp] : fixedExpenses.map(e => e.id === exp.id ? exp : e)
  updateFixed(updated)
}
const delFixed = (id: string | number) => updateFixed(fixedExpenses.filter(e => e.id !== id))
```

Por:

```ts
const saveFixed  = (exp: FixedExpense) => {
  const idx     = fixedExpenses.findIndex(e => e.id === exp.id)
  const updated = idx === -1 ? [...fixedExpenses, exp] : fixedExpenses.map(e => e.id === exp.id ? exp : e)
  updateMonthFixed(key, updated)
}
const delFixed   = (id: string | number) => updateMonthFixed(key, fixedExpenses.filter(e => e.id !== id))
const copyFixed  = () => updateMonthFixed(key, prevMonthFixed.map(e => ({ ...e, id: newId() })))
```

- [ ] **Step 4: Actualizar el render de FijosTab para pasar las props nuevas**

Buscar la línea:
```tsx
{tab === 'fijos'     && <FijosTab fixedExpenses={fixedExpenses} totalFixed={totalFixed} onEdit={setEditFixed} onAdd={() => setAddFixed(true)} />}
```

Reemplazar por:
```tsx
{tab === 'fijos'     && <FijosTab fixedExpenses={fixedExpenses} totalFixed={totalFixed} onEdit={setEditFixed} onAdd={() => setAddFixed(true)} prevFixedExpenses={prevMonthFixed} onCopyFromPrev={copyFixed} />}
```

- [ ] **Step 5: Verificar TypeScript**

```bash
npx tsc --noEmit
```
Esperado: error en `FijosTab.tsx` porque todavía no acepta las nuevas props (se corrige en Task 5).

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire per-month fixed expenses logic in App"
```

---

## Task 5: Agregar botón "Copiar fijos del mes anterior" en FijosTab

**Files:**
- Modify: `src/components/tabs/FijosTab.tsx`

- [ ] **Step 1: Reescribir FijosTab con las nuevas props y el botón**

El archivo completo debe quedar así:

```tsx
import { useState } from 'react'
import { fixedIcon } from '../../constants'
import { fmt } from '../../utils'
import type { FixedExpense } from '../../types'

interface Props {
  fixedExpenses:     FixedExpense[]
  totalFixed:        number
  onEdit:            (e: FixedExpense) => void
  onAdd:             () => void
  prevFixedExpenses: FixedExpense[]
  onCopyFromPrev:    () => void
}

export default function FijosTab({ fixedExpenses, totalFixed, onEdit, onAdd, prevFixedExpenses, onCopyFromPrev }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    onCopyFromPrev()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <div className="flex items-center justify-between px-[2px] pt-1">
        <span className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.5px]">Gastos fijos mensuales</span>
        <span className="text-[13px] font-bold text-indigo-600">{fmt(totalFixed)}</span>
      </div>

      {prevFixedExpenses.length > 0 && (
        <button
          onClick={handleCopy}
          className={`w-full py-[10px] px-[14px] border-2 border-dashed border-amber-300 rounded-[12px] text-[14px] font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all ${copied ? 'bg-green-50 text-emerald-600' : 'bg-amber-50 text-amber-700'}`}
        >
          {copied ? '✅ Copiado!' : '📋 Copiar fijos del mes anterior'}
        </button>
      )}

      {fixedExpenses.map(e => (
        <div key={String(e.id)} className="bg-white rounded-2xl p-[13px_14px] flex items-center gap-3 shadow-[0_1px_4px_rgba(79,70,229,0.07)]">
          <div className="w-10 h-10 rounded-[11px] bg-gradient-to-br from-yellow-100 to-yellow-200 flex items-center justify-center text-[19px] flex-shrink-0">
            {fixedIcon(e.name)}
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-semibold text-[#1e1b4b]">{e.name}</div>
            <div className="text-[12px] text-slate-400 mt-[1px]">Se repite cada mes</div>
          </div>
          <div className="text-[15px] font-bold text-amber-600 whitespace-nowrap">{fmt(e.amount)}</div>
          <button className="bg-transparent border-none text-[#c7d2fe] text-[20px] cursor-pointer p-1 flex-shrink-0" onClick={() => onEdit(e)}>✎</button>
        </div>
      ))}

      <button
        className="bg-transparent border-2 border-dashed border-[#c7d2fe] rounded-[14px] p-[13px] text-indigo-400 text-[14px] font-semibold cursor-pointer text-center w-full active:bg-indigo-50"
        onClick={onAdd}
      >
        + Añadir gasto fijo
      </button>
    </>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```
Esperado: sin errores.

- [ ] **Step 3: Build de verificación**

```bash
npm run build
```
Esperado: build exitoso sin warnings de TypeScript.

- [ ] **Step 4: Commit**

```bash
git add src/components/tabs/FijosTab.tsx
git commit -m "feat: add copy-from-previous-month button to FijosTab"
```

---

## Task 6: Verificación manual

- [ ] **Step 1: Arrancar la app**

```bash
npm run dev
```

- [ ] **Step 2: Verificar migración lazy**
  - Ir a un mes que ya tenía gastos fijos globales
  - Los fijos deben aparecer (venidos del fallback global)
  - Editar o eliminar uno → debe guardarse en `months.KEY.fixedExpenses`
  - Ir al mes anterior → sus fijos no deben haberse afectado

- [ ] **Step 3: Verificar el botón copiar**
  - Ir a un mes nuevo sin fijos propios
  - El botón "Copiar fijos del mes anterior" debe aparecer (si el mes anterior tiene fijos)
  - Presionar el botón → aparece "✅ Copiado!" por 2 segundos, los fijos se cargan
  - Eliminar uno del mes actual → ir al mes anterior, verificar que sus fijos no cambiaron

- [ ] **Step 4: Commit final (si hubo ajustes)**

```bash
git add -A
git commit -m "fix: post-verification adjustments"
```
