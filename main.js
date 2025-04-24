const { app, BrowserWindow } = require('electron');

let mainWindow;

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    fullscreen: true, // Launch in full-screen mode
    webPreferences: {
      preload: __dirname + '/renderer.js',
    },
  });

  mainWindow.loadFile('index.html');
});


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});