const { Tray, Menu, nativeImage, app } = require('electron');
const path = require('path');
const scheduler = require('./scheduler');
const settingsWindow = require('./settingsWindow');
const settingsStore = require('./settingsStore');

let tray = null;

function buildMenu() {
  const { paused, pausedUntil } = settingsStore.get();
  const items = [{ label: 'Drink water now', click: () => scheduler.fireNow() }];

  if (paused) {
    items.push({ label: 'Resume', click: () => { scheduler.resume(); refresh(); } });
  } else if (pausedUntil) {
    items.push({ label: 'Resume now', click: () => { scheduler.resumeFromPauseForToday(); refresh(); } });
  } else {
    items.push({ label: 'Pause', click: () => { scheduler.pause(); refresh(); } });
    items.push({ label: 'Pause for today', click: () => { scheduler.pauseForToday(); refresh(); } });
  }

  items.push({ label: 'Settings...', click: () => settingsWindow.open() });
  items.push({ type: 'separator' });
  items.push({ label: 'Quit', click: () => app.quit() });

  return Menu.buildFromTemplate(items);
}

function refresh() {
  const { paused, pausedUntil, todayCount } = settingsStore.get();
  tray.setContextMenu(buildMenu());

  let label = 'Water Reminder';
  if (paused) label += ' (paused)';
  else if (pausedUntil) label += ' (paused for today)';
  label += ` — ${todayCount || 0} today`;

  tray.setToolTip(label);
}

function create() {
  const iconPath = path.join(__dirname, '..', '..', 'assets', 'icon.png');
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  tray = new Tray(icon);
  refresh();
}

module.exports = { create, refresh };
