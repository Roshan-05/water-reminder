const { BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const settingsStore = require('./settingsStore');

let win = null;

ipcMain.handle('settings:get', () => settingsStore.get());
ipcMain.handle('settings:set', (event, partial) => settingsStore.set(partial));

function open() {
  if (win) {
    win.focus();
    return;
  }
  win = new BrowserWindow({
    width: 340,
    height: 300,
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
