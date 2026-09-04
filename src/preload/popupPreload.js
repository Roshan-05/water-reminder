const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('waterReminder', {
  drankWater: () => ipcRenderer.send('popup:drank'),
  snooze: (minutes) => ipcRenderer.send('popup:snooze', minutes),
  getSpriteConfig: () => ipcRenderer.invoke('popup:get-sprite-config'),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  showConfetti: () => ipcRenderer.send('popup:show-confetti'),
  hideConfetti: () => ipcRenderer.send('popup:hide-confetti'),
});
