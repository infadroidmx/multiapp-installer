let getMainWindow = () => null;

function setMainWindowGetter(getter) {
    getMainWindow = getter;
}

function logToUI(msg) {
    const mainWindow = getMainWindow();
    if (mainWindow) {
        mainWindow.webContents.send('log-message', msg);
    }
}

module.exports = { logToUI, setMainWindowGetter };
