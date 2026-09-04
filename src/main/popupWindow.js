const { BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const WIN_W = 300;
const WIN_H = 340;
const MARGIN = 20;

let currentWindow = null;
let confettiWindow = null;
let currentDisplayBounds = null;
let handlersRegistered = false;

function registerHandlers() {
  if (handlersRegistered) return;
  handlersRegistered = true;

  ipcMain.handle('popup:get-sprite-config', () => {
    const configPath = path.join(__dirname, '..', '..', 'assets', 'sprite', 'sprite.config.json');
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  });

  ipcMain.on('popup:drank', () => {
    closeCurrent();
    require('./scheduler').onDrank();
  });

  ipcMain.on('popup:snooze', (event, minutes) => {
    closeCurrent();
    require('./scheduler').onSnooze(minutes);
  });

  ipcMain.on('popup:show-confetti', () => showConfetti());
  ipcMain.on('popup:hide-confetti', () => hideConfetti());
}

function showConfetti() {
  if (confettiWindow) return;

  const bounds = currentDisplayBounds || screen.getPrimaryDisplay().bounds;

  confettiWindow = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    movable: false,
    skipTaskbar: true,
    focusable: false,
    hasShadow: false,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  confettiWindow.setIgnoreMouseEvents(true);
  confettiWindow.setAlwaysOnTop(true, 'screen-saver');
  confettiWindow.loadFile(path.join(__dirname, '..', 'renderer', 'confetti', 'index.html'));

  confettiWindow.once('ready-to-show', () => {
    if (confettiWindow && !confettiWindow.isDestroyed()) {
      confettiWindow.showInactive();
    }
  });
}

function hideConfetti() {
  if (confettiWindow && !confettiWindow.isDestroyed()) {
    confettiWindow.destroy();
  }
  confettiWindow = null;
}

function closeCurrent() {
  if (currentWindow && !currentWindow.isDestroyed()) {
    currentWindow.destroy();
  }
  currentWindow = null;
  hideConfetti();
}

function showReminder() {
  registerHandlers();
  closeCurrent();

  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const { workArea } = display;
  currentDisplayBounds = display.bounds;
  const x = workArea.x + workArea.width - WIN_W - MARGIN;
  const y = workArea.y + workArea.height - WIN_H - MARGIN;

  currentWindow = new BrowserWindow({
    width: WIN_W,
    height: WIN_H,
    x,
    y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    movable: false,
    skipTaskbar: true,
    focusable: false,
    hasShadow: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'popupPreload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  currentWindow.setAlwaysOnTop(true, 'screen-saver');
  currentWindow.loadFile(path.join(__dirname, '..', 'renderer', 'popup', 'index.html'));

  currentWindow.once('ready-to-show', () => {
    if (currentWindow && !currentWindow.isDestroyed()) {
      currentWindow.showInactive();
    }
  });

  if (process.env.WR_TEST_AUTOFIRE) {
    currentWindow.webContents.on('console-message', (event, level, message) => {
      console.log('[renderer]', message);
    });
  }
}

module.exports = { showReminder };
