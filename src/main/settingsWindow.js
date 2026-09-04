const { BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const settingsStore = require('./settingsStore');
const firebase = require('./firebase');
const authStore = require('./authStore');

let win = null;

ipcMain.handle('settings:get', () => settingsStore.get());
ipcMain.handle('settings:set', (event, partial) => settingsStore.set(partial));

ipcMain.handle('auth:status', () => {
  const user = firebase.getCurrentUser();
  return { signedIn: !!user, email: user ? user.email : null };
});

ipcMain.handle('auth:sign-in', async (event, { email, password }) => {
  const user = await firebase.signIn(email, password);
  authStore.saveCredentials(email, password, user.uid);
  settingsStore.init(user.uid);
  return { signedIn: true, email: user.email };
});

ipcMain.handle('auth:sign-up', async (event, { email, password }) => {
  const user = await firebase.signUp(email, password);
  authStore.saveCredentials(email, password, user.uid);
  settingsStore.init(user.uid);
  return { signedIn: true, email: user.email };
});

ipcMain.handle('auth:sign-out', async () => {
  await firebase.signOut();
  authStore.clearCredentials();
  return { signedIn: false, email: null };
});

function open() {
  if (win) {
    win.focus();
    return;
  }
  win = new BrowserWindow({
    width: 340,
    height: 460,
    resizable: false,
    title: 'Water Reminder Settings',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'settingsPreload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, '..', 'renderer', 'settings', 'index.html'));
  win.on('closed', () => {
    win = null;
  });
}

module.exports = { open };
