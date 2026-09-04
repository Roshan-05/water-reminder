const { powerMonitor } = require('electron');
const settingsStore = require('./settingsStore');

const IDLE_THRESHOLD_SEC = 120;
const IDLE_POLL_MS = 15000;

let activeTimer = null;

function getPopupWindow() {
  return require('./popupWindow');
}

function getTray() {
  return require('./tray');
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function todayMidnightEnd() {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d;
}

function scheduleNext(ms) {
  clearTimeout(activeTimer);
  activeTimer = setTimeout(fire, ms);
}

function fire() {
  const { paused, pausedUntil } = settingsStore.get();
  if (paused || pausedUntil) return;

  if (powerMonitor.getSystemIdleTime() >= IDLE_THRESHOLD_SEC) {
    activeTimer = setTimeout(fire, IDLE_POLL_MS);
    return;
  }

  getPopupWindow().showReminder();
}

function fireNow() {
  clearTimeout(activeTimer);
  getPopupWindow().showReminder();
}

function recordDrink() {
  const { todayDate, todayCount } = settingsStore.get();
  const key = todayKey();
  if (todayDate === key) {
    settingsStore.set({ todayCount: todayCount + 1 });
  } else {
    settingsStore.set({ todayDate: key, todayCount: 1 });
  }
}

function onDrank() {
  recordDrink();
  const { intervalMinutes } = settingsStore.get();
  scheduleNext(intervalMinutes * 60000);
  getTray().refresh();
}

function onSnooze(minutesOverride) {
  const { snoozeMinutes } = settingsStore.get();
  const minutes = minutesOverride || snoozeMinutes;
  scheduleNext(minutes * 60000);
}

function pause() {
  clearTimeout(activeTimer);
  settingsStore.set({ paused: true, pausedUntil: null });
}

function resume() {
  settingsStore.set({ paused: false });
  const { intervalMinutes } = settingsStore.get();
  scheduleNext(intervalMinutes * 60000);
}

function pauseForToday() {
  clearTimeout(activeTimer);
  const target = todayMidnightEnd();
  settingsStore.set({ pausedUntil: target.toISOString() });
  activeTimer = setTimeout(resumeFromPauseForToday, target.getTime() - Date.now());
}

function resumeFromPauseForToday() {
  clearTimeout(activeTimer);
  settingsStore.set({ pausedUntil: null });
  const { intervalMinutes } = settingsStore.get();
  scheduleNext(intervalMinutes * 60000);
}

function armFromStoredState() {
  const { paused, pausedUntil, intervalMinutes } = settingsStore.get();
  if (paused) return;

  if (pausedUntil) {
    const remainingMs = new Date(pausedUntil).getTime() - Date.now();
    if (remainingMs > 0) {
      clearTimeout(activeTimer);
      activeTimer = setTimeout(resumeFromPauseForToday, remainingMs);
      return;
    }
    settingsStore.set({ pausedUntil: null });
  }

  scheduleNext(intervalMinutes * 60000);
}

function start() {
  armFromStoredState();
}

function onRemoteStateChange() {
  armFromStoredState();
}

powerMonitor.on('suspend', () => {
  clearTimeout(activeTimer);
});

powerMonitor.on('resume', () => {
  armFromStoredState();
});

module.exports = {
  start,
  fireNow,
  onDrank,
  onSnooze,
  pause,
  resume,
  pauseForToday,
  resumeFromPauseForToday,
  onRemoteStateChange,
};
