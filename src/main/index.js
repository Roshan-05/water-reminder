const { app } = require('electron');

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  const tray = require('./tray');
  const scheduler = require('./scheduler');
  const autoLaunch = require('./autoLaunch');
  const authStore = require('./authStore');
  const firebase = require('./firebase');
  const settingsStore = require('./settingsStore');
  require('./settingsWindow');

  app.on('window-all-closed', () => {});

  app.whenReady().then(async () => {
    autoLaunch.enable();
    tray.create();

    if (!process.env.WR_TEST_NO_FIREBASE) {
      const cached = authStore.getCredentials();
      if (cached) {
        try {
          const user = await firebase.signIn(cached.email, cached.password);
          settingsStore.init(user.uid);
        } catch (err) {
          console.error('Firebase sign-in failed:', err);
        }
      }
    }

    scheduler.start();

    if (process.env.WR_TEST_AUTOFIRE) {
      setTimeout(() => scheduler.fireNow(), 1000);
      setTimeout(() => app.quit(), 7000);
    }
  });
}
