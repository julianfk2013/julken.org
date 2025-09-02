const { app, BrowserWindow } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
    title: "Space Dodgers Test"
  });

  // TEST: just show a message instead of loading your game
  win.loadURL('data:text/html,<h1 style="font-family:sans-serif">Space Dodgers test ✅</h1>');

  // Optional: show DevTools so you can see console if needed
  win.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
