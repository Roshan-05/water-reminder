import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from './firebaseConfig.js';

const DEFAULT_STATE = {
  intervalMinutes: 30,
  snoozeMinutes: 5,
  paused: false,
  pausedUntil: null,
  soundEnabled: true,
  todayDate: '',
  todayCount: 0,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function observeAuthState(cb) {
  return onAuthStateChanged(auth, cb);
}

async function signIn(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

async function signUp(email, password) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  return credential.user;
}

async function signOut() {
  await firebaseSignOut(auth);
}

function getCurrentUser() {
  return auth.currentUser;
}

async function ensureUserDoc(uid) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  await setDoc(ref, {
    ...DEFAULT_STATE,
    updatedAt: serverTimestamp(),
    lastWriter: 'android',
  });
}

function subscribeToUserState(uid, cb) {
  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => {
      if (snap.metadata.hasPendingWrites) return;
      if (snap.exists()) cb(snap.data());
    },
    (err) => {
      console.error('[dataLayer] onSnapshot error:', err);
    }
  );
}

async function pushUserState(uid, partial) {
  const payload = { ...partial, updatedAt: serverTimestamp(), lastWriter: 'android' };
  if (typeof payload.todayCountDelta === 'number') {
    payload.todayCount = increment(payload.todayCountDelta);
    delete payload.todayCountDelta;
  }
  await setDoc(doc(db, 'users', uid), payload, { merge: true });
}

export {
  observeAuthState,
  signIn,
  signUp,
  signOut,
  getCurrentUser,
  ensureUserDoc,
  subscribeToUserState,
  pushUserState,
};
