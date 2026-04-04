# Gastos fijos por mes + limpieza de código

**Fecha:** 2026-04-04

## Objetivo

Hacer que los gastos fijos sean independientes por mes (actualmente son globales al hogar). Añadir un botón para copiar los fijos del mes anterior, igual al que existe en ingresos. Eliminar código muerto.

---

## 1. Cambios en tipos (`src/types.ts`)

Agregar `fixedExpenses` opcional a `MonthData`:

```ts
interface MonthData {
  incomeSources: IncomeSource[]
  savings: number
  expenses: Expense[]
  fixedExpenses?: FixedExpense[]  // nuevo campo
}
```

`HouseholdData.fixedExpenses` se mantiene en el tipo como campo legacy para la migración lazy, pero no se escribe más.

---

## 2. Migración lazy

Al resolver los fijos del mes actual en `App.tsx`:

```ts
const fixedExpenses = md.fixedExpenses ?? householdData?.fixedExpenses ?? []
```

- Si el mes ya tiene `fixedExpenses` propios → se usan esos (independiente)
- Si no (mes viejo o nuevo sin fijos) → se usan los globales como fallback de lectura
- Al primer guardado (add/edit/delete) → se escribe en `months.KEY.fixedExpenses` y el mes queda independiente para siempre

No se requiere script de migración ni acción manual del usuario.

---

## 3. Cambios en `useHousehold` (`src/hooks/useHousehold.ts`)

- **Agregar** `updateMonthFixed(key: string, fixedExpenses: FixedExpense[])` que escribe en `months.KEY.fixedExpenses`
- **Eliminar** `updateFixed` (ya no se necesita actualizar los fijos globales)

---

## 4. Cambios en `App.tsx`

- Calcular `prevMonthFixed` igual que `prevMonthSources`:
  ```ts
  const prevMonthFixed = (householdData?.months?.[prevMonthKey]?.fixedExpenses ?? householdData?.fixedExpenses ?? []) as FixedExpense[]
  ```
- `saveFixed` y `delFixed` llaman a `updateMonthFixed(key, ...)` en lugar de `updateFixed`
- Agregar `onCopyFromPrev` que copia `prevMonthFixed` con IDs nuevos al mes actual
- Pasar `prevFixedExpenses` y `onCopyFromPrev` a `FijosTab`

---

## 5. Cambios en `FijosTab` (`src/components/tabs/FijosTab.tsx`)

Nuevas props:
```ts
prevFixedExpenses: FixedExpense[]
onCopyFromPrev: () => void
```

Nuevo botón (visible cuando `prevFixedExpenses.length > 0`), con estado `copied` de 2 segundos:

```tsx
<button onClick={onCopyFromPrev} className="...amber/dashed...">
  {copied ? '✅ Copiado!' : '📋 Copiar fijos del mes anterior'}
</button>
```

Estilo: dashed border amber, consistente con el tab de fijos (amarillo). El botón aparece aunque el mes actual ya tenga fijos.

---

## 6. Limpieza de código

- **Eliminar** `todayStr` de `src/utils.ts` — exportada pero sin ningún uso en el proyecto
- **Eliminar** `updateFixed` de `useHousehold` luego del refactor
- Verificar que no queden imports huérfanos tras los cambios

---

## Archivos afectados

| Archivo | Cambio |
|---|---|
| `src/types.ts` | Agregar `fixedExpenses?` a `MonthData` |
| `src/hooks/useHousehold.ts` | Reemplazar `updateFixed` por `updateMonthFixed` |
| `src/App.tsx` | Resolver fijos con fallback, pasar props nuevas a `FijosTab` |
| `src/components/tabs/FijosTab.tsx` | Agregar botón copiar + props nuevas |
| `src/utils.ts` | Eliminar `todayStr` |

---

## Lo que NO cambia

- El modal `FixedModal` no cambia (ya funciona bien)
- La lógica de `totalFixed` no cambia
- Los gastos variables y los ingresos no se tocan
- No se hace migración upfront; los datos históricos siguen funcionando via fallback
