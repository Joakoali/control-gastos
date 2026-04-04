import { useState, useEffect, useCallback } from 'react'
import {
  doc, getDoc, setDoc, updateDoc, onSnapshot,
} from 'firebase/firestore'
import { User } from 'firebase/auth'
import { db } from '../firebase'
import { HISTORICAL_MONTHS } from '../data/historicalData'
import type { HouseholdData, FixedExpense, MonthData } from '../types'

const genCode = (): string => Math.random().toString(36).substring(2, 8).toUpperCase()

export function useHousehold(user: User | null | undefined) {
  const [householdId,   setHouseholdId]   = useState<string | null>(null)
  const [householdData, setHouseholdData] = useState<HouseholdData | null>(null)
  const [loadingHH,     setLoadingHH]     = useState(true)

  useEffect(() => {
    if (!user) { setLoadingHH(false); return }
    const userRef = doc(db, 'users', user.uid)
    getDoc(userRef).then(snap => {
      if (snap.exists() && snap.data().householdId) {
        setHouseholdId(snap.data().householdId as string)
      }
      setLoadingHH(false)
    })
  }, [user])

  useEffect(() => {
    if (!householdId) return
    const ref = doc(db, 'households', householdId)
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) setHouseholdData(snap.data() as HouseholdData)
    })
    return unsub
  }, [householdId])

  const createHousehold = useCallback(async () => {
    if (!user) return
    const code  = genCode()
    const hhRef = doc(db, 'households', code)
    await setDoc(hhRef, {
      code,
      members:       [user.uid],
      createdBy:     user.uid,
      fixedExpenses: [],
      months:        {},
    })
    await setDoc(doc(db, 'users', user.uid), {
      householdId:  code,
      displayName:  user.displayName,
      email:        user.email,
    })
    setHouseholdId(code)
  }, [user])

  const joinHousehold = useCallback(async (code: string) => {
    if (!user) return
    const trimmed = code.trim().toUpperCase()
    const hhRef   = doc(db, 'households', trimmed)
    const snap    = await getDoc(hhRef)
    if (!snap.exists()) throw new Error('Código incorrecto. Verificá y volvé a intentar.')
    const data = snap.data() as HouseholdData
    if (!data.members.includes(user.uid)) {
      await updateDoc(hhRef, { members: [...data.members, user.uid] })
    }
    await setDoc(doc(db, 'users', user.uid), {
      householdId: trimmed,
      displayName: user.displayName,
      email:       user.email,
    })
    setHouseholdId(trimmed)
  }, [user])

  const updateMonth = useCallback(async (key: string, patch: Partial<MonthData>) => {
    if (!householdId || !householdData) return
    const current = householdData.months?.[key] || { incomeSources: [], savings: 0, expenses: [] }
    await updateDoc(doc(db, 'households', householdId), {
      [`months.${key}`]: { ...current, ...patch },
    })
  }, [householdId, householdData])

  const updateMonthFixed = useCallback(async (key: string, fixedExpenses: FixedExpense[]) => {
    if (!householdId) return
    await updateDoc(doc(db, 'households', householdId), {
      [`months.${key}`]: {
        ...(householdData?.months?.[key] || { incomeSources: [], savings: 0, expenses: [] }),
        fixedExpenses,
      },
    })
  }, [householdId, householdData])

  const importHistoricalData = useCallback(async (): Promise<number> => {
    if (!householdId) return 0
    const patch: Record<string, MonthData> = {}
    Object.entries(HISTORICAL_MONTHS).forEach(([key, val]) => {
      if (!householdData?.months?.[key]) patch[`months.${key}`] = val as MonthData
    })
    if (Object.keys(patch).length === 0) return 0
    await updateDoc(doc(db, 'households', householdId), patch)
    return Object.keys(patch).length
  }, [householdId, householdData])

  return { householdId, householdData, loadingHH, createHousehold, joinHousehold, updateMonth, updateMonthFixed, importHistoricalData }
}
