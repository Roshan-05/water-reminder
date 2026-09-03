const settingsStore = require('./settingsStore');

let activeTimer = null;

function getPopupWindow() {
  return require('./popupWindow');
}

function scheduleNext(ms) {
  clearTimeout(activeTimer);
  activeTimer = setTimeout(fire, ms);
}

function fire() {
  const { paused } = settingsStore.get();
  if (paused) return;
  getPopupWindow().showReminder();
}

function fireNow() {
  clearTimeout(activeTimer);
  getPopupWindow().showReminder();
}

function onDrank() {
  const { intervalMinutes } = settingsStore.get();
  scheduleNext(intervalMinutes * 60000);
}

function onSnooze() {
  const { snoozeMinutes } = settingsStore.get();
  scheduleNext(snoozeMinutes * 60000);
}

function pause() {
  clearTimeout(activeTimer);
  settingsStore.set({ paused: true });
}

function resume() {
  settingsStore.set({ paused: false });
  const { intervalMinutes } = settingsStore.get();
  scheduleNext(intervalMinutes * 60000);
}

function start() {
  const { paused, intervalMinutes } = settingsStore.get();
  if (!paused) {
    scheduleNext(intervalMinutes * 60000);
  }
}

module.exports = { start, fireNow, onDrank, onSnooze, pause, resume };
