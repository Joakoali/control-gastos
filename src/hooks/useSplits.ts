import { useState, useEffect, useCallback } from 'react'
import {
  collection, doc, addDoc, updateDoc, getDoc, getDocs,
  query, where, onSnapshot, arrayUnion,
} from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { db } from '../firebase'
import { newId } from '../utils'
import { calculateBalances, userNetExpense, participantKey } from '../splitUtils'
import type { Split, SplitParticipant, SplitExpense, SplitNotification } from '../types'

export function useSplits(user: User | null | undefined) {
  const [splits, setSplits] = useState<Split[]>([])
  const [pendingNotifications, setPendingNotifications] = useState<SplitNotification[]>([])

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'splits'),
      where('participantUids', 'array-contains', user.uid),
    )
    return onSnapshot(q, snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Split))
      docs.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      setSplits(docs)
    })
  }, [user])

  useEffect(() => {
    if (!user) return
    return onSnapshot(doc(db, 'users', user.uid), snap => {
      if (snap.exists()) {
        setPendingNotifications(snap.data().pendingSplitNotifications ?? [])
      }
    })
  }, [user])

  const createSplit = useCallback(async (title: string, participants: SplitParticipant[]) => {
    if (!user) return
    const participantUids = participants
      .filter(p => p.type === 'user')
      .map(p => p.uid!)
    if (!participantUids.includes(user.uid)) participantUids.push(user.uid)

    await addDoc(collection(db, 'splits'), {
      title,
      createdBy:      user.uid,
      createdAt:      new Date().toISOString(),
      status:         'open',
      participants,
      participantUids,
      expenses:       [],
    })
  }, [user])

  const addSplitExpense = useCallback(async (splitId: string, expense: Omit<SplitExpense, 'id'>) => {
    const newExpense: SplitExpense = { ...expense, id: newId() }
    await updateDoc(doc(db, 'splits', splitId), { expenses: arrayUnion(newExpense) })
  }, [])

  const closeSplit = useCallback(async (splitId: string) => {
    if (!user) return
    const ref  = doc(db, 'splits', splitId)
    const snap = await getDoc(ref)
    if (!snap.exists()) return
    const split = { id: snap.id, ...snap.data() } as Split
    if (split.status !== 'open') return

    const { transfers } = calculateBalances(split.expenses, split.participants)

    // Flip status first — if rules reject it, another caller already closed this split
    await updateDoc(ref, { status: 'closed' })

    for (const p of split.participants) {
      if (p.type !== 'user' || !p.uid) continue
      const key       = participantKey(p)
      const netAmount = userNetExpense(key, split.expenses)
      const notification: SplitNotification = {
        splitId:  split.id,
        title:    split.title,
        netAmount,
        balances: transfers,
      }
      await updateDoc(doc(db, 'users', p.uid), {
        pendingSplitNotifications: arrayUnion(notification),
      })
    }
  }, [user])

  const dismissNotification = useCallback(async (splitId: string) => {
    if (!user) return
    const { runTransaction } = await import('firebase/firestore')
    const ref = doc(db, 'users', user.uid)
    await runTransaction(db, async tx => {
      const snap = await tx.get(ref)
      if (!snap.exists()) return
      const current: SplitNotification[] = snap.data().pendingSplitNotifications ?? []
      tx.update(ref, {
        pendingSplitNotifications: current.filter(n => n.splitId !== splitId),
      })
    })
  }, [user])

  const searchUserByEmail = useCallback(async (email: string): Promise<SplitParticipant | null> => {
    const q    = query(collection(db, 'users'), where('email', '==', email.trim().toLowerCase()))
    const snap = await getDocs(q)
    if (snap.empty) return null
    const d = snap.docs[0]
    return { type: 'user', uid: d.id, name: d.data().displayName ?? email }
  }, [])

  return {
    splits,
    pendingNotifications,
    createSplit,
    addSplitExpense,
    closeSplit,
    dismissNotification,
    searchUserByEmail,
  }
}
