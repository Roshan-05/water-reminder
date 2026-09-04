const Store = require('electron-store');
const firebase = require('./firebase');

const store = new Store({
  defaults: {
    intervalMinutes: 30,
    snoozeMinutes: 5,
    paused: false,
    pausedUntil: null,
    soundEnabled: true,
    todayDate: '',
    todayCount: 0,
    nextFireAt: null,
  },
});

let currentUid = null;
let unsubscribe = null;

function getScheduler() {
  return require('./scheduler');
}

function getTray() {
  return require('./tray');
}

function get() {
  return {
    intervalMinutes: store.get('intervalMinutes'),
    snoozeMinutes: store.get('snoozeMinutes'),
    paused: store.get('paused'),
    pausedUntil: store.get('pausedUntil'),
    soundEnabled: store.get('soundEnabled'),
    todayDate: store.get('todayDate'),
    todayCount: store.get('todayCount'),
    nextFireAt: store.get('nextFireAt'),
  };
}

function applyLocal(partial) {
  for (const [key, value] of Object.entries(partial)) {
    store.set(key, value);
  }
}

function pushToFirebase(partial, previous) {
  if (!currentUid) return;
  const payload = { ...partial };
  if ('todayCount' in partial) {
    const isNewDay = 'todayDate' in partial && partial.todayDate !== previous.todayDate;
    if (!isNewDay) {
      payload.todayCountDelta = partial.todayCount - previous.todayCount;
      delete payload.todayCount;
    }
  }
  firebase.pushUserState(currentUid, payload, 'desktop').catch((err) => {
    console.error('Failed to sync settings to Firebase:', err);
  });
}

function set(partial) {
  const previous = get();
  applyLocal(partial);
  pushToFirebase(partial, previous);
  return get();
}

function handleRemoteUpdate(remote) {
  const { updatedAt, lastWriter, ...fields } = remote;
  applyLocal(fields);
  getScheduler().onRemoteStateChange();
  getTray().refresh();
}

function init(uid) {
  currentUid = uid;
  if (unsubscribe) unsubscribe();
  unsubscribe = firebase.subscribeToUserState(uid, handleRemoteUpdate);
}

module.exports = { get, set, init };
