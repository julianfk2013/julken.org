const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    icon: path.join(__dirname, 'build', 'spacedodgers-icon.ico'),
    webPreferences: { nodeIntegration: false, contextIsolation: true },
    title: 'Space Dodgers'
  });
  win.loadFile(path.join(__dirname, 'app', 'spacedodgers.html'));
}

function setupAutoUpdates() {
  autoUpdater.autoDownload = true;
  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on('update-available', () => console.log('Update available…'));
  autoUpdater.on('update-not-available', () => console.log('No update.'));
  autoUpdater.on('error', (e) => console.error('Updater error:', e));
  autoUpdater.on('download-progress', (p) => console.log(`DL ${Math.round(p.percent)}%`));
  autoUpdater.on('update-downloaded', () => {
    const choice = dialog.showMessageBoxSync({
      type: 'question',
      buttons: ['Restart now', 'Later'],
      defaultId: 0,
      cancelId: 1,
      title: 'Update ready',
      message: 'A new version is ready. Restart now to install?'
    });
    if (choice === 0) autoUpdater.quitAndInstall();
  });
}

app.whenReady().then(() => {
  createWindow();
  setupAutoUpdates();
  setInterval(() => autoUpdater.checkForUpdates(), 4 * 60 * 60 * 1000);
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
