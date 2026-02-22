import { getApp, getApps, initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

export const firebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

const authErrorMessages: Record<string, string> = {
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/missing-password": "Please enter your password.",
  "auth/weak-password": "Password should be at least 6 characters.",
  "auth/email-already-in-use": "This email is already in use.",
  "auth/user-not-found": "No account found for this email.",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/too-many-requests": "Too many attempts. Please try again later.",
  "auth/popup-closed-by-user": "Google sign-in was canceled.",
  "auth/network-request-failed":
    "Network error. Check your internet connection and try again.",
};

const getAuthErrorMessage = (error: unknown): string => {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = String(error.code);
    return (
      authErrorMessages[code] ?? "Authentication failed. Please try again."
    );
  }

  return "Authentication failed. Please try again.";
};

const applyPersistence = async () => {
  await setPersistence(auth, browserLocalPersistence);
};

export const createAccountWithEmailPassword = async (
  email: string,
  password: string,
) => {
  await applyPersistence();
  return createUserWithEmailAndPassword(auth, email, password);
};

export const signInWithEmailPassword = async (
  email: string,
  password: string,
) => {
  await applyPersistence();
  return signInWithEmailAndPassword(auth, email, password);
};

export const signInWithGoogle = async () => {
  await applyPersistence();
  return signInWithPopup(auth, googleProvider);
};

export const signOutUser = async () => {
  await signOut(auth);
};

export { getAuthErrorMessage };
