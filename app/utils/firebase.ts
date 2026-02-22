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
import {
  doc,
  getDoc,
  getFirestore,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

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
export const db = getFirestore(firebaseApp);

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

export interface UserLocationState {
  favoriteMachineIds: string[];
  visitedMachineIds: string[];
}

const getUserLocationsRef = (uid: string) => {
  return doc(db, "users", uid, "metadata", "locations");
};

export const getUserLocationState = async (
  uid: string,
): Promise<UserLocationState> => {
  const snapshot = await getDoc(getUserLocationsRef(uid));

  if (!snapshot.exists()) {
    return {
      favoriteMachineIds: [],
      visitedMachineIds: [],
    };
  }

  const data = snapshot.data();

  return {
    favoriteMachineIds: Array.isArray(data.favoriteMachineIds)
      ? data.favoriteMachineIds.filter(
          (value): value is string => typeof value === "string",
        )
      : [],
    visitedMachineIds: Array.isArray(data.visitedMachineIds)
      ? data.visitedMachineIds.filter(
          (value): value is string => typeof value === "string",
        )
      : [],
  };
};

const updateLocationIds = (
  currentIds: string[],
  machineId: string,
  shouldInclude: boolean,
): string[] => {
  const idSet = new Set(currentIds);

  if (shouldInclude) {
    idSet.add(machineId);
  } else {
    idSet.delete(machineId);
  }

  return Array.from(idSet);
};

export const setUserFavoriteMachine = async (
  uid: string,
  machineId: string,
  isFavorite: boolean,
): Promise<UserLocationState> => {
  const locationsRef = getUserLocationsRef(uid);

  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(locationsRef);
    const data = snapshot.data();

    const currentFavorites = Array.isArray(data?.favoriteMachineIds)
      ? data.favoriteMachineIds.filter(
          (value): value is string => typeof value === "string",
        )
      : [];

    const nextState: UserLocationState = {
      favoriteMachineIds: updateLocationIds(
        currentFavorites,
        machineId,
        isFavorite,
      ),
      visitedMachineIds: Array.isArray(data?.visitedMachineIds)
        ? data.visitedMachineIds.filter(
            (value): value is string => typeof value === "string",
          )
        : [],
    };

    transaction.set(
      locationsRef,
      {
        ...nextState,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    return nextState;
  });
};

export const setUserVisitedMachine = async (
  uid: string,
  machineId: string,
  isVisited: boolean,
): Promise<UserLocationState> => {
  const locationsRef = getUserLocationsRef(uid);

  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(locationsRef);
    const data = snapshot.data();

    const currentVisited = Array.isArray(data?.visitedMachineIds)
      ? data.visitedMachineIds.filter(
          (value): value is string => typeof value === "string",
        )
      : [];

    const nextState: UserLocationState = {
      favoriteMachineIds: Array.isArray(data?.favoriteMachineIds)
        ? data.favoriteMachineIds.filter(
            (value): value is string => typeof value === "string",
          )
        : [],
      visitedMachineIds: updateLocationIds(
        currentVisited,
        machineId,
        isVisited,
      ),
    };

    transaction.set(
      locationsRef,
      {
        ...nextState,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    return nextState;
  });
};

export { getAuthErrorMessage };
