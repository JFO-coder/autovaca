/**
 * Firestore CRUD operations for Autovaca.
 * Collections: groups, groups/{id}/transactions, groups/{id}/settlements
 */

import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc,
  query, orderBy, where, serverTimestamp, Timestamp
} from 'firebase/firestore'
import { db } from '../firebase'

// ─── Groups ───────────────────────────────────────────────

export async function createGroup(groupData) {
  const ref = await addDoc(collection(db, 'groups'), {
    ...groupData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    archived: false
  })
  return ref.id
}

export async function getGroup(groupId) {
  const snap = await getDoc(doc(db, 'groups', groupId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function getGroups() {
  const q = query(collection(db, 'groups'), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function updateGroup(groupId, data) {
  await updateDoc(doc(db, 'groups', groupId), {
    ...data,
    updatedAt: serverTimestamp()
  })
}

// ─── Transactions ─────────────────────────────────────────

export async function addTransaction(groupId, txnData) {
  const ref = await addDoc(
    collection(db, 'groups', groupId, 'transactions'),
    {
      ...txnData,
      date: txnData.date instanceof Date ? Timestamp.fromDate(txnData.date) : txnData.date,
      createdAt: serverTimestamp(),
      migrated: txnData.migrated || false
    }
  )
  return ref.id
}

export async function getTransactions(groupId) {
  const q = query(
    collection(db, 'groups', groupId, 'transactions'),
    orderBy('date', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => {
    const data = d.data()
    return {
      id: d.id,
      ...data,
      date: data.date?.toDate?.() || data.date
    }
  })
}

export async function getTransactionsByCategory(groupId, category) {
  const q = query(
    collection(db, 'groups', groupId, 'transactions'),
    where('category', '==', category),
    orderBy('date', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => {
    const data = d.data()
    return {
      id: d.id,
      ...data,
      date: data.date?.toDate?.() || data.date
    }
  })
}

export async function updateTransaction(groupId, txnId, data) {
  await updateDoc(doc(db, 'groups', groupId, 'transactions', txnId), data)
}

export async function deleteTransaction(groupId, txnId) {
  await deleteDoc(doc(db, 'groups', groupId, 'transactions', txnId))
}

// ─── Settlements ──────────────────────────────────────────

export async function saveSettlement(groupId, settlementData) {
  const ref = await addDoc(
    collection(db, 'groups', groupId, 'settlements'),
    {
      ...settlementData,
      createdAt: serverTimestamp()
    }
  )
  return ref.id
}

export async function getSettlements(groupId) {
  const q = query(
    collection(db, 'groups', groupId, 'settlements'),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
