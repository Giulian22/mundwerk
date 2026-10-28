/* Nur die Teile von Firebase, die Mundwerk braucht. Gebaut mit: npm run build:firebase */
export {initializeApp} from 'firebase/app';
export {initializeAuth,indexedDBLocalPersistence,browserLocalPersistence,browserPopupRedirectResolver,GoogleAuthProvider,signInWithPopup,signInWithCredential,getRedirectResult,signOut,onAuthStateChanged,connectAuthEmulator} from 'firebase/auth';
export {getFirestore,doc,runTransaction,connectFirestoreEmulator} from 'firebase/firestore/lite';
