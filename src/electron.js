const electron = require('electron');
const {app, BrowserWindow, Tray, Menu} = electron;

const path = require('path');
const isDev = require('electron-is-dev');
require('electron-reload')(__dirname);

let mainWindow;
let tray = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
        },
    });

    mainWindow.loadURL(
        isDev
            ? 'http://localhost:3000'
            : `file://${path.join(__dirname, '../build/index.html')}`,
    );

    mainWindow.on('closed', () => {
        mainWindow = null
    })
}

const createTray = () => {
    tray = new Tray('assets/cloud_icon.png');
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Open', click: createWindow},
        { label: 'Quit', click: () => app.quit()},
    ]);

    tray.setToolTip('This is my application.');
    tray.setContextMenu(contextMenu)
};

app.on('ready', () => {
    createTray();
});

// app.on('window-all-closed', () => {
//     if (process.platform !== 'darwin') {
//         app.quit()
//     }
// });

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow()
    }
});