/**
 * FX Rate Service
 *
 * Fetches live exchange rates for AR$ (blue) and CLP → USD.
 * Caches rates in memory and optionally in Firestore.
 */

import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes

let memoryCache = {
  arsBlueVenta: null,
  clpPerUSD: null,
  fetchedAt: null
}

/**
 * Fetch AR$ blue sell rate from DolarAPI.
 * Returns pesos per 1 USD.
 */
async function fetchArsBlue() {
  try {
    const res = await fetch('https://dolarapi.com/v1/dolares/blue')
    if (!res.ok) throw new Error(`DolarAPI error: ${res.status}`)
    const data = await res.json()
    return data.venta // pesos per 1 USD
  } catch (err) {
    console.error('Failed to fetch ARS blue rate:', err)
    return null
  }
}

/**
 * Fetch CLP per USD rate.
 * Primary: DolarAPI Chile endpoint. Fallback: exchangerate-api.
 */
async function fetchClpRate() {
  try {
    // Try DolarAPI Chile first
    const res = await fetch('https://dolarapi.com/v1/cotizaciones/clp')
    if (res.ok) {
      const data = await res.json()
      return data.venta || data.valor
    }
  } catch (err) {
    console.warn('DolarAPI Chile failed, trying fallback:', err)
  }

  try {
    // Fallback: free exchangerate API
    const res = await fetch('https://open.er-api.com/v6/latest/USD')
    if (res.ok) {
      const data = await res.json()
      return data.rates?.CLP
    }
  } catch (err) {
    console.error('All CLP rate sources failed:', err)
  }

  return null
}

/**
 * Get current FX rates. Uses memory cache, then Firestore cache, then live fetch.
 * @param {boolean} forceRefresh - bypass cache
 * @returns {{ arsBlueVenta: number, clpPerUSD: number, fetchedAt: Date, source: string }}
 */
export async function getFxRates(forceRefresh = false) {
  // Check memory cache
  if (!forceRefresh && memoryCache.fetchedAt) {
    const age = Date.now() - memoryCache.fetchedAt.getTime()
    if (age < CACHE_TTL_MS) return { ...memoryCache }
  }

  // Check Firestore cache
  if (!forceRefresh) {
    try {
      const docRef = doc(db, 'fxRates', 'latest')
      const snap = await getDoc(docRef)
      if (snap.exists()) {
        const data = snap.data()
        const fetchedAt = data.fetchedAt?.toDate?.() || new Date(data.fetchedAt)
        const age = Date.now() - fetchedAt.getTime()
        if (age < CACHE_TTL_MS) {
          memoryCache = { ...data, fetchedAt }
          return { ...memoryCache }
        }
      }
    } catch (err) {
      console.warn('Firestore cache read failed:', err)
    }
  }

  // Live fetch
  const [arsBlueVenta, clpPerUSD] = await Promise.all([fetchArsBlue(), fetchClpRate()])

  const rates = {
    arsBlueVenta: arsBlueVenta || memoryCache.arsBlueVenta,
    clpPerUSD: clpPerUSD || memoryCache.clpPerUSD,
    fetchedAt: new Date(),
    source: 'dolarapi.com'
  }

  memoryCache = { ...rates }

  // Persist to Firestore
  try {
    await setDoc(doc(db, 'fxRates', 'latest'), rates)
  } catch (err) {
    console.warn('Firestore cache write failed:', err)
  }

  return rates
}

/**
 * Convert an amount to USD given a currency code.
 * @param {number} amount - amount in original currency
 * @param {string} currency - "USD", "ARS", or "CLP"
 * @param {object} rates - output of getFxRates()
 * @returns {{ amountUSD: number, fxRate: number, fxSource: string }}
 */
export function convertToUSD(amount, currency, rates) {
  switch (currency) {
    case 'USD':
      return { amountUSD: amount, fxRate: 1, fxSource: 'none' }
    case 'ARS':
      if (!rates.arsBlueVenta) throw new Error('ARS blue rate not available')
      return {
        amountUSD: Math.round((amount / rates.arsBlueVenta) * 100) / 100,
        fxRate: rates.arsBlueVenta,
        fxSource: 'dolarapi-blue-venta'
      }
    case 'CLP':
      if (!rates.clpPerUSD) throw new Error('CLP rate not available')
      return {
        amountUSD: Math.round((amount / rates.clpPerUSD) * 100) / 100,
        fxRate: rates.clpPerUSD,
        fxSource: 'dolarapi-clp'
      }
    default:
      throw new Error(`Unsupported currency: ${currency}`)
  }
}
