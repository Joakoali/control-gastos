import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            "AIzaSyAlOGVXqdKQLzH3S2dfw1JEhUk7acFY_RU",
  authDomain:        "gastos-familia-57727.firebaseapp.com",
  projectId:         "gastos-familia-57727",
  storageBucket:     "gastos-familia-57727.firebasestorage.app",
  messagingSenderId: "930982813008",
  appId:             "1:930982813008:web:684d702189027b9a0e6055",
}

const app           = initializeApp(firebaseConfig)
export const auth   = getAuth(app)
export const db     = getFirestore(app, 'gastos')
export const googleProvider = new GoogleAuthProvider()
