const { initializeApp } = require('firebase/app');
const {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut: firebaseSignOut,
} = require('firebase/auth');
const {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  increment,
  serverTimestamp,
} = require('firebase/firestore');
const firebaseConfig = require('./firebaseConfig');

let app = null;
let auth = null;
let db = null;
let currentUser = null;

function ensureInitialized() {
  if (app) return;
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

async function signIn(email, password) {
  ensureInitialized();
  const credential = await signInWithEmailAndPassword(auth, email, password);
  currentUser = credential.user;
  return currentUser;
}

async function signUp(email, password) {
  ensureInitialized();
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  currentUser = credential.user;
  return currentUser;
}

async function signOut() {
  ensureInitialized();
  await firebaseSignOut(auth);
  currentUser = null;
}

function getCurrentUser() {
  return currentUser;
}

function subscribeToUserState(uid, cb) {
  ensureInitialized();
  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => {
      if (snap.metadata.hasPendingWrites) return;
      if (snap.exists()) cb(snap.data());
    },
    (err) => {
      console.error('[firebase] onSnapshot error:', err);
    }
  );
}

async function pushUserState(uid, partial, writer) {
  ensureInitialized();
  const payload = { ...partial, updatedAt: serverTimestamp(), lastWriter: writer };
  if (typeof payload.todayCountDelta === 'number') {
    payload.todayCount = increment(payload.todayCountDelta);
    delete payload.todayCountDelta;
  }
  await setDoc(doc(db, 'users', uid), payload, { merge: true });
}

module.exports = {
  signIn,
  signUp,
  signOut,
  getCurrentUser,
  subscribeToUserState,
  pushUserState,
};
