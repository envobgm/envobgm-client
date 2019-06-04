const { remote } = require('electron');

const { mainWindowId } = remote.getGlobal('windowManager');

remote.BrowserWindow.fromId(mainWindowId).webContents.send('ping', 'someThing');
