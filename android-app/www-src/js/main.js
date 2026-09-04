import { LocalNotifications } from '@capacitor/local-notifications';
import { App } from '@capacitor/app';
import { observeAuthState, ensureUserDoc, subscribeToUserState, pushUserState } from './dataLayer.js';
import {
  requestPermissions,
  armFromStoredState,
  computeAndPushNextFireAt,
  cancelReminder,
  canDrawOverlays,
  showOverlayNow,
} from './scheduler.js';

LocalNotifications.addListener('localNotificationActionPerformed', () => {
  window.location.href = 'reminder.html';
});

App.addListener('appUrlOpen', ({ url }) => {
  if (url && url.startsWith('waterreminder://reminder')) {
    window.location.href = 'reminder.html';
  }
});

const countEl = document.getElementById('count');
const statusEl = document.getElementById('status');
const drinkBtn = document.getElementById('drink-btn');
const pauseBtn = document.getElementById('pause-btn');
const settingsBtn = document.getElementById('settings-btn');

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

drinkBtn.addEventListener('click', async () => {
  if (!uid || !state) return;
  const allowed = await canDrawOverlays();
  if (allowed) {
    const shown = await showOverlayNow();
    if (shown) return;
  }
  window.location.href = 'reminder.html';
});

pauseBtn.addEventListener('click', async () => {
  if (!uid || !state) return;
  const paused = !state.paused;
  state = { ...state, paused };
  render();
  try {
    if (paused) {
      await pushUserState(uid, { paused, nextFireAt: null });
      await cancelReminder();
    } else {
      await pushUserState(uid, { paused });
      await computeAndPushNextFireAt(uid, state.intervalMinutes);
    }
  } catch (err) {
    statusEl.textContent = `Sync failed: ${err.message}`;
  }
});

settingsBtn.addEventListener('click', () => {
  window.location.href = 'settings.html';
});
