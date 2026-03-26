import { useState, useEffect, useCallback } from 'react'
import {
  doc, getDoc, setDoc, updateDoc, onSnapshot,
  collection, query, where, getDocs,
} from 'firebase/firestore'
import { db } from '../firebase'
import { DEFAULT_FIXED, MARZO_2026 } from '../data/initialData'

// Genera un código de hogar de 6 chars
const genCode = () => Math.random().toString(36).substring(2, 8).toUpperCase()

// ─── Hook principal ──────────────────────────────────────
export function useHousehold(user) {
  const [householdId,   setHouseholdId]   = useState(null)
  const [householdData, setHouseholdData] = useState(null)
  const [loadingHH,     setLoadingHH]     = useState(true)

  // Cargar householdId del usuario
  useEffect(() => {
    if (!user) { setLoadingHH(false); return }

    const userRef = doc(db, 'users', user.uid)
    getDoc(userRef).then(snap => {
      if (snap.exists() && snap.data().householdId) {
        setHouseholdId(snap.data().householdId)
      }
      setLoadingHH(false)
    })
  }, [user])

  // Suscripción en tiempo real al hogar
  useEffect(() => {
    if (!householdId) return
    const ref = doc(db, 'households', householdId)
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) setHouseholdData(snap.data())
    })
    return unsub
  }, [householdId])

  // ── Crear hogar nuevo ────────────────────────────────
  const createHousehold = useCallback(async () => {
    const code = genCode()
    const hhRef = doc(db, 'households', code)
    const initialData = {
      code,
      members: [user.uid],
      createdBy: user.uid,
      fixedExpenses: DEFAULT_FIXED,
      months: {
        '2026-2': {
          incomeSources: [
            { id: 'i1', name: 'Sueldo Joako',  amount: 1553.33 },
            { id: 'i2', name: 'Sueldo Esposa', amount: 1553.33 },
          ],
          savings: 3507.23,
          expenses: MARZO_2026,
        },
      },
    }
    await setDoc(hhRef, initialData)
    await setDoc(doc(db, 'users', user.uid), {
      householdId: code,
      displayName: user.displayName,
      email: user.email,
    })
    setHouseholdId(code)
  }, [user])

  // ── Unirse a un hogar existente con código ───────────
  const joinHousehold = useCallback(async (code) => {
    const trimmed = code.trim().toUpperCase()
    const hhRef = doc(db, 'households', trimmed)
    const snap = await getDoc(hhRef)
    if (!snap.exists()) throw new Error('Código incorrecto. Verificá y volvé a intentar.')

    const data = snap.data()
    if (!data.members.includes(user.uid)) {
      await updateDoc(hhRef, { members: [...data.members, user.uid] })
    }
    await setDoc(doc(db, 'users', user.uid), {
      householdId: trimmed,
      displayName: user.displayName,
      email: user.email,
    })
    setHouseholdId(trimmed)
  }, [user])

  // ── Actualizar datos del hogar ───────────────────────
  const updateHousehold = useCallback(async (patch) => {
    if (!householdId) return
    await updateDoc(doc(db, 'households', householdId), patch)
  }, [householdId])

  // ── Helpers para mes actual ──────────────────────────
  const updateMonth = useCallback(async (key, patch) => {
    if (!householdId || !householdData) return
    const currentMonth = householdData.months?.[key] || { incomeSources: [], savings: 0, expenses: [] }
    await updateDoc(doc(db, 'households', householdId), {
      [`months.${key}`]: { ...currentMonth, ...patch },
    })
  }, [householdId, householdData])

  const updateFixed = useCallback(async (fixedExpenses) => {
    if (!householdId) return
    await updateDoc(doc(db, 'households', householdId), { fixedExpenses })
  }, [householdId])

  return {
    householdId,
    householdData,
    loadingHH,
    createHousehold,
    joinHousehold,
    updateMonth,
    updateFixed,
  }
}
