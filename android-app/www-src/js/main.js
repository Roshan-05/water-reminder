import { LocalNotifications } from '@capacitor/local-notifications';
import { App } from '@capacitor/app';
import { observeAuthState, signOut, ensureUserDoc, subscribeToUserState, pushUserState } from './dataLayer.js';
import { requestPermissions, armFromStoredState, rescheduleIn } from './scheduler.js';

LocalNotifications.addListener('localNotificationActionPerformed', () => {
  window.location.href = 'reminder.html';
});

const countEl = document.getElementById('count');
const statusEl = document.getElementById('status');
const drinkBtn = document.getElementById('drink-btn');
const pauseBtn = document.getElementById('pause-btn');
const signoutBtn = document.getElementById('signout-btn');

let uid = null;
let state = null;
let unsubscribeState = null;

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function render() {
  if (!state) {
    countEl.textContent = '—';
    statusEl.textContent = 'Loading...';
    return;
  }
  const count = state.todayDate === todayKey() ? state.todayCount || 0 : 0;
  countEl.textContent = String(count);
  statusEl.textContent = state.paused ? 'Reminders paused' : 'Reminders active';
  pauseBtn.textContent = state.paused ? 'Resume' : 'Pause';
}

observeAuthState(async (user) => {
  if (!user) {
    window.location.href = 'signin.html';
    return;
  }
  uid = user.uid;
  state = null;
  render();
  if (unsubscribeState) unsubscribeState();
  unsubscribeState = subscribeToUserState(uid, (remote) => {
    state = remote;
    render();
    armFromStoredState(uid, remote).catch((err) => console.error('[scheduler] arm failed:', err));
  });
  try {
    await ensureUserDoc(uid);
  } catch (err) {
    statusEl.textContent = `Sync failed: ${err.message}`;
  }
  try {
    await requestPermissions();
  } catch (err) {
    console.error('[scheduler] requestPermissions failed:', err);
  }
});

App.addListener('appStateChange', ({ isActive }) => {
  if (isActive && uid && state) {
    armFromStoredState(uid, state).catch((err) => console.error('[scheduler] arm failed:', err));
  }
});

drinkBtn.addEventListener('click', () => {
  if (!uid || !state) return;
  const key = todayKey();
  const isNewDay = state.todayDate !== key;
  const payload = isNewDay
    ? { todayDate: key, todayCount: 1 }
    : { todayDate: key, todayCountDelta: 1 };
  state = { ...state, todayDate: key, todayCount: isNewDay ? 1 : (state.todayCount || 0) + 1 };
  render();
  pushUserState(uid, payload).catch((err) => {
    statusEl.textContent = `Sync failed: ${err.message}`;
  });
  rescheduleIn(state.intervalMinutes).catch((err) => console.error('[scheduler] reschedule failed:', err));
});

pauseBtn.addEventListener('click', () => {
  if (!uid || !state) return;
  const paused = !state.paused;
  state = { ...state, paused };
  render();
  pushUserState(uid, { paused }).catch((err) => {
    statusEl.textContent = `Sync failed: ${err.message}`;
  });
});

signoutBtn.addEventListener('click', async () => {
  if (unsubscribeState) unsubscribeState();
  await signOut();
});
