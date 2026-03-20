import { useState, useEffect } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '../firebase'

const googleProvider = new GoogleAuthProvider()

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function loginWithGoogle() {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
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
