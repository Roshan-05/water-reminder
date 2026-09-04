const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('settingsApi', {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (values) => ipcRenderer.invoke('settings:set', values),
  getAuthStatus: () => ipcRenderer.invoke('auth:status'),
  signIn: (email, password) => ipcRenderer.invoke('auth:sign-in', { email, password }),
  signUp: (email, password) => ipcRenderer.invoke('auth:sign-up', { email, password }),
  signOut: () => ipcRenderer.invoke('auth:sign-out'),
});
