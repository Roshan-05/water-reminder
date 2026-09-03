const { Tray, Menu, nativeImage, app } = require('electron');
const path = require('path');
const scheduler = require('./scheduler');
const settingsWindow = require('./settingsWindow');
const settingsStore = require('./settingsStore');

let tray = null;

function buildMenu() {
  const { paused } = settingsStore.get();
  return Menu.buildFromTemplate([
    { label: 'Drink water now', click: () => scheduler.fireNow() },
    {
      label: paused ? 'Resume' : 'Pause',
      click: () => {
        if (paused) {
          scheduler.resume();
        } else {
          scheduler.pause();
        }
        refresh();
      },
    },
    { label: 'Settings...', click: () => settingsWindow.open() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ]);
}

function refresh() {
  const { paused } = settingsStore.get();
  tray.setContextMenu(buildMenu());
  tray.setToolTip(paused ? 'Water Reminder (paused)' : 'Water Reminder');
}

function create() {
  const iconPath = path.join(__dirname, '..', '..', 'assets', 'icon.png');
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  tray = new Tray(icon);
  refresh();
}

module.exports = { create };
