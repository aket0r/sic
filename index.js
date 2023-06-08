const url = require("url");
const path = require("path");
const {app, BrowserWindow} = require("electron");
let win;

function createWindow() {
    win = new BrowserWindow({
        resizable: true,
        width: 1920,
        height: 1080,
        autoHideMenuBar: true,
        icon: `${__dirname}/assets/icon/icon.ico`,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            __dirname: true
        },
        show: true
    });
    win.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true,
    }));
    win.maximize();
    win.removeMenu();
    // win.webContents.openDevTools();
    app.focus();
}

app.on('ready', createWindow);
app.on('window-all-closed', () => {
    app.quit();
});