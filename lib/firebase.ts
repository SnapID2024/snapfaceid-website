'use client'

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'
import { getDatabase, Database } from 'firebase/database'
import { getAuth, Auth } from 'firebase/auth'

// Firebase configuration - Only initialized on client side
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
}

let app: FirebaseApp | null = null
let database: Database | null = null
let auth: Auth | null = null

// Initialize Firebase only if config is complete
const isConfigValid = () => {
  return (
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.databaseURL
  )
}

const initializeFirebase = () => {
  if (!isConfigValid()) {
    console.warn('Firebase config is incomplete. Some features may not work.')
    return false
  }

  try {
    const existingApps = getApps()
    if (existingApps.length === 0) {
      app = initializeApp(firebaseConfig)
    } else {
      app = getApp()
    }

    database = getDatabase(app)
    auth = getAuth(app)
    return true
  } catch (error) {
    console.error('Failed to initialize Firebase:', error)
    return false
  }
}

// Initialize on module load
initializeFirebase()

export { app, database, auth }
export default app
