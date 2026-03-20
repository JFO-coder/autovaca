import { useState, useEffect } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '../firebase'

const googleProvider = new GoogleAuthProvider()

// Only these 4 brothers can access the app
const ALLOWED_EMAILS = [
  'jfordonez@gmail.com',
  'ordonezmariano@gmail.com',
  'ordonez.ignacio@gmail.com',
  'augusto.ordonez@gmail.com',
]

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser && !ALLOWED_EMAILS.includes(firebaseUser.email)) {
        // Unauthorized email — sign them out immediately
        signOut(auth)
        setUser(null)
      } else {
        setUser(firebaseUser)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function loginWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const email = result.user?.email
      if (!ALLOWED_EMAILS.includes(email)) {
        await signOut(auth)
        throw new Error('UNAUTHORIZED')
      }
    } catch (err) {
      if (err.message === 'UNAUTHORIZED') {
        throw new Error('Solo los hermanos Ordóñez pueden acceder. Cuenta no autorizada.')
      }
      console.error('Login failed:', err)
      throw err
    }
  }

  async function logout() {
    try {
      await signOut(auth)
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  return { user, loading, loginWithGoogle, logout }
}
