import { observeAuthState, signOut, subscribeToUserState, pushUserState } from './dataLayer.js';
import {
  computeAndPushNextFireAt,
  canUseFullScreenIntent,
  openFullScreenIntentSettings,
  canDrawOverlays,
  requestOverlayPermission,
} from './scheduler.js';

const intervalInput = document.getElementById('interval');
const soundInput = document.getElementById('sound');
const status = document.getElementById('status');
const saveBtn = document.getElementById('save');
const signoutBtn = document.getElementById('signout-btn');
const backBtn = document.getElementById('back-btn');
const fullscreenWarning = document.getElementById('fullscreen-warning');
const fullscreenSettingsBtn = document.getElementById('fullscreen-settings-btn');
const overlayWarning = document.getElementById('overlay-warning');
const overlaySettingsBtn = document.getElementById('overlay-settings-btn');

canUseFullScreenIntent().then((allowed) => {
  fullscreenWarning.style.display = allowed ? 'none' : 'block';
});

fullscreenSettingsBtn.addEventListener('click', () => {
  openFullScreenIntentSettings();
});

canDrawOverlays().then((allowed) => {
  overlayWarning.style.display = allowed ? 'none' : 'block';
});

overlaySettingsBtn.addEventListener('click', () => {
  requestOverlayPermission();
});

let uid = null;
let state = null;
let unsubscribe = null;

observeAuthState((user) => {
  if (!user) {
    window.location.href = 'signin.html';
    return;
  }
  uid = user.uid;
  if (unsubscribe) unsubscribe();
  unsubscribe = subscribeToUserState(uid, (remote) => {
    state = remote;
    intervalInput.value = remote.intervalMinutes;
    soundInput.checked = remote.soundEnabled;
  });
});

saveBtn.addEventListener('click', async () => {
  if (!uid) return;
  const intervalMinutes = Number(intervalInput.value);
  const soundEnabled = soundInput.checked;
  const intervalChanged = state && intervalMinutes !== state.intervalMinutes;
  try {
    await pushUserState(uid, { intervalMinutes, soundEnabled });
    if (intervalChanged && state && !state.paused) {
      await computeAndPushNextFireAt(uid, intervalMinutes);
    }
    status.textContent = 'Saved.';
    setTimeout(() => {
      status.textContent = '';
    }, 1500);
  } catch (err) {
    status.textContent = `Sync failed: ${err.message}`;
  }
});

signoutBtn.addEventListener('click', async () => {
  if (unsubscribe) unsubscribe();
  await signOut();
});

backBtn.addEventListener('click', () => {
  window.location.href = 'index.html';
});
