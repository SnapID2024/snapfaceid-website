'use client'

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getDatabase, Database } from 'firebase/database'
import { getAuth, Auth } from 'firebase/auth'
import { getStorage, FirebaseStorage } from 'firebase/storage'

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
let db: Firestore | null = null           // Firestore for Users, Persons
let realtimeDb: Database | null = null    // Realtime DB for Guardian Alerts
let auth: Auth | null = null
let storage: FirebaseStorage | null = null

// Initialize Firebase only if config is complete
const isConfigValid = () => {
  return (
    firebaseConfig.apiKey &&
    firebaseConfig.projectId
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

    // Firestore for structured data (Users, Persons)
    db = getFirestore(app)

    // Realtime Database for live data (Guardian Alerts, Location tracking)
    if (firebaseConfig.databaseURL) {
      realtimeDb = getDatabase(app)
    }

    auth = getAuth(app)
    storage = getStorage(app)
    return true
  } catch (error) {
    console.error('Failed to initialize Firebase:', error)
    return false
  }
}

// Initialize on module load
initializeFirebase()

export { app, db, realtimeDb, auth, storage }
export default app
