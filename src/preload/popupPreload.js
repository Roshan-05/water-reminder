const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('waterReminder', {
  drankWater: () => ipcRenderer.send('popup:drank'),
  snooze: () => ipcRenderer.send('popup:snooze'),
  getSpriteConfig: () => ipcRenderer.invoke('popup:get-sprite-config'),
});
