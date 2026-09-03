const { app } = require('electron');

function enable() {
  if (!app.isPackaged) return;
  app.setLoginItemSettings({
    openAtLogin: true,
    path: process.execPath,
  });
}

module.exports = { enable };
