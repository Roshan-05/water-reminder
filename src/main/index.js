const { app } = require('electron');

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  const tray = require('./tray');
  const scheduler = require('./scheduler');
  const autoLaunch = require('./autoLaunch');
  require('./settingsWindow');

  app.on('window-all-closed', () => {});

  app.whenReady().then(() => {
    autoLaunch.enable();
    tray.create();
    scheduler.start();
  });
}
