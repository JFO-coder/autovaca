import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

// Firebase config for project: autovaca-38455
// Get these values from Firebase Console → Project Settings → General → Your apps → Web app
const firebaseConfig = {
  apiKey: "AIzaSyCd4xEPj7PUHaFWR2QeU79STKsxE3fYj2o",
  authDomain: "autovaca-38455.firebaseapp.com",
  projectId: "autovaca-38455",
  storageBucket: "autovaca-38455.firebasestorage.app",
  messagingSenderId: "873845085149",
  appId: "1:873845085149:web:b946d5ecd4948fb85ddc34"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
export default app
