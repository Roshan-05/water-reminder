const Store = require('electron-store');

const store = new Store({
  defaults: {
    intervalMinutes: 30,
    snoozeMinutes: 5,
    paused: false,
  },
});

function get() {
  return {
    intervalMinutes: store.get('intervalMinutes'),
    snoozeMinutes: store.get('snoozeMinutes'),
    paused: store.get('paused'),
  };
}

function set(partial) {
  for (const [key, value] of Object.entries(partial)) {
    store.set(key, value);
  }
  return get();
}

module.exports = { get, set };
