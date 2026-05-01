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

export type TabType = 'variables' | 'fijos' | 'ingresos' | 'splits'

export interface Category {
  id: string
  label: string
  emoji: string
}

// ── Splits ────────────────────────────────────────────────────────────────────

export interface SplitParticipant {
  type: 'user' | 'alias'
  uid?: string     // only when type === 'user'
  name: string     // displayName for users, free text for aliases
}

export interface SplitExpense {
  id: string
  description: string
  amount: number
  date?: string        // ISO date string, optional for backwards compat
  paidBy: string       // uid for users, name for aliases
  splitAmong: string[] // uids for users, names for aliases
}

export interface Split {
  id: string
  title: string
  createdBy: string
  createdAt: string
  status: 'open' | 'closed'
  participants: SplitParticipant[]
  participantUids: string[]  // for Firestore array-contains queries
  expenses: SplitExpense[]
}

export interface SplitBalance {
  from: string  // uid or alias name
  to: string
  amount: number
}

export interface SplitNotification {
  splitId: string
  title: string
  netAmount: number    // user's real share of expenses (always >= 0)
  balances: SplitBalance[]
}
