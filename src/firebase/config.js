import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, browserLocalPersistence, setPersistence } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
} from "firebase/firestore";

const cleanEnv = (val) => {
  if (!val) return "";
  return String(val).trim().replace(/^["']|["']$/g, "");
};

const firebaseConfig = {
  apiKey: cleanEnv(import.meta.env?.VITE_FIREBASE_API_KEY) || "AIzaSyCsmFeswGk1X6Jr7eUmI_bRpjQ7yxLh7Ig",
  authDomain: cleanEnv(import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN) || "galaxy-dairy-befd9.firebaseapp.com",
  projectId: cleanEnv(import.meta.env?.VITE_FIREBASE_PROJECT_ID) || "galaxy-dairy-befd9",
  storageBucket: cleanEnv(import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET) || "galaxy-dairy-befd9.firebasestorage.app",
  messagingSenderId: cleanEnv(import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) || "457646599625",
  appId: cleanEnv(import.meta.env?.VITE_FIREBASE_APP_ID) || "1:457646599625:web:c778935a7d173d82ca8c18",
};

// Check if all necessary environment variables are set
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

let app = null;
let auth = null;
let db = null;
let googleProvider = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    try {
      auth = getAuth(app);
      setPersistence(auth, browserLocalPersistence).catch((err) => {
        console.warn("Firebase persistence warning:", err?.message || err);
      });
      googleProvider = new GoogleAuthProvider();
      googleProvider.setCustomParameters({ prompt: "select_account" });
    } catch (authInitError) {
      console.warn("Firebase Auth initialization warning:", authInitError?.message || authInitError);
    }
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    } catch (cacheInitError) {
      console.warn(
        "Firestore persistent cache init warning, using standard Firestore:",
        cacheInitError?.message || cacheInitError
      );
      try {
        db = getFirestore(app);
      } catch (dbInitError) {
        console.warn("Firestore initialization warning:", dbInitError?.message || dbInitError);
      }
    }
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else {
  console.info(
    "[Galaxy Dairy] Firebase configuration not set in .env. Running in offline/local storage mode."
  );
}

export { app, auth, db, googleProvider };
