'use strict';

const { app, BrowserWindow, Menu, dialog, session, shell } = require('electron');
const {
  APP_ENTRY_URL,
  isAllowedAppUrl,
  isAllowedExternalUrl,
} = require('./security_policy.cjs');

const gotSingleInstanceLock = app.requestSingleInstanceLock();
let mainWindow = null;

function openExternalSafely(url) {
  if (!isAllowedExternalUrl(url)) return;
  void shell.openExternal(url);
}

function protectWebContents(window) {
  const contents = window.webContents;

  contents.setWindowOpenHandler(({ url }) => {
    if (isAllowedAppUrl(url)) {
      void window.loadURL(url);
    } else {
      openExternalSafely(url);
    }
    return { action: 'deny' };
  });

  contents.on('will-navigate', (event, url) => {
    if (isAllowedAppUrl(url)) return;
    event.preventDefault();
    openExternalSafely(url);
  });

  contents.on('will-attach-webview', (event) => event.preventDefault());
  contents.on('before-input-event', (event, input) => {
    const key = String(input.key || '').toLowerCase();
    if (key === 'f12' || (input.control && input.shift && key === 'i')) {
      event.preventDefault();
    }
  });
}

function configureSession() {
  const currentSession = session.defaultSession;
  currentSession.setPermissionCheckHandler(() => false);
  currentSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 360,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#05090d',
    title: 'Dajo AI Public Beta',
    icon: `${__dirname}/assets/dajo-icon.ico`,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      webviewTag: false,
      devTools: false,
      safeDialogs: true,
      navigateOnDragDrop: false,
    },
  });

  protectWebContents(window);
  window.once('ready-to-show', () => window.show());
  window.webContents.on('render-process-gone', (_event, details) => {
    if (details.reason !== 'clean-exit') void window.reload();
  });

  void window.loadURL(APP_ENTRY_URL).catch((error) => {
    void dialog.showMessageBox(window, {
      type: 'error',
      title: 'Dajo niet bereikbaar',
      message: 'De Dajo-service is momenteel niet bereikbaar.',
      detail: `Controleer je internetverbinding en probeer opnieuw.\n\n${error.message}`,
      buttons: ['Sluiten'],
    }).finally(() => window.close());
  });

  return window;
}

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });

  app.on('certificate-error', (event, _webContents, _url, _error, _certificate, callback) => {
    event.preventDefault();
    callback(false);
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    configureSession();
    mainWindow = createWindow();
    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  });

  app.on('window-all-closed', () => app.quit());
}
