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
