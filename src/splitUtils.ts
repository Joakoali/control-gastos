import type { SplitExpense, SplitParticipant, SplitBalance } from './types'

export function participantKey(p: SplitParticipant): string {
  return p.type === 'user' ? p.uid! : p.name
}

export interface BalanceResult {
  netAmounts: Record<string, number>
  transfers: SplitBalance[]
}

export function calculateBalances(
  expenses: SplitExpense[],
  participants: SplitParticipant[],
): BalanceResult {
  const net: Record<string, number> = {}
  for (const p of participants) net[participantKey(p)] = 0

  for (const exp of expenses) {
    if (exp.splitAmong.length === 0) continue
    const share = exp.amount / exp.splitAmong.length
    net[exp.paidBy] = (net[exp.paidBy] ?? 0) + exp.amount
    for (const key of exp.splitAmong) {
      net[key] = (net[key] ?? 0) - share
    }
  }

  for (const k of Object.keys(net)) {
    net[k] = Math.round(net[k] * 100) / 100
  }

  const debtors = Object.entries(net)
    .filter(([, v]) => v < -0.005)
    .map(([k, v]) => ({ key: k, amount: v }))
    .sort((a, b) => a.amount - b.amount)

  const creditors = Object.entries(net)
    .filter(([, v]) => v > 0.005)
    .map(([k, v]) => ({ key: k, amount: v }))
    .sort((a, b) => b.amount - a.amount)

  const transfers: SplitBalance[] = []
  let i = 0, j = 0
  while (i < debtors.length && j < creditors.length) {
    const settle = Math.min(-debtors[i].amount, creditors[j].amount)
    transfers.push({
      from:   debtors[i].key,
      to:     creditors[j].key,
      amount: Math.round(settle * 100) / 100,
    })
    debtors[i].amount  += settle
    creditors[j].amount -= settle
    if (Math.abs(debtors[i].amount)   < 0.005) i++
    if (Math.abs(creditors[j].amount) < 0.005) j++
  }

  return { netAmounts: net, transfers }
}

// Real cost to a user = sum of their share across all expenses they participated in
export function userNetExpense(userKey: string, expenses: SplitExpense[]): number {
  const total = expenses.reduce((sum, exp) => {
    if (!exp.splitAmong.includes(userKey)) return sum
    return sum + exp.amount / exp.splitAmong.length
  }, 0)
  return Math.round(total * 100) / 100
}
