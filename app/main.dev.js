/* eslint global-require: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 *
 * @flow
 */
import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  globalShortcut
} from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import log from 'electron-log';
import os from 'os';
import MenuBuilder from './menu';

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow = null;
let tray = null;
const iconPath = path.join(__dirname, '..', 'resources', 'icons', '16x16.png');
const iconPath8x = path.join(
  __dirname,
  '..',
  'resources',
  'icons',
  '128x128.png'
);
const DARWIN = os.platform() === 'darwin';
const WIN32 = os.platform() !== 'darwin' && os.platform() !== 'linux2';

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

  return Promise.all(
    extensions.map(name => installer.default(installer[name], forceDownload))
  ).catch(console.log);
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  /**
   * 创建窗口
   */
  (function createWindow() {
    mainWindow = new BrowserWindow({
      show: false,
      frame: false,
      width: 1024,
      height: 728
    });

    mainWindow.loadURL(`file://${__dirname}/app.html`);

    // @TODO: Use 'ready-to-show' event
    //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
    mainWindow.webContents.on('did-finish-load', () => {
      if (!mainWindow) {
        throw new Error('"mainWindow" is not defined');
      }
      if (process.env.START_MINIMIZED) {
        mainWindow.minimize();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    });

    const menuBuilder = new MenuBuilder(mainWindow);
    menuBuilder.buildMenu();

    /**
     * 窗口事件
     */
    (function events() {})();
  })();

  /**
   * 托盘对象
   */
  (function appTray() {
    const image = nativeImage.createFromPath(iconPath);
    tray = new Tray(image);
    tray.on('double-click', () => {
      mainWindow.show();
      if (DARWIN) {
        app.dock.show();
      }
      if (WIN32) {
        const menuBuilder = new MenuBuilder(mainWindow);
        menuBuilder.buildMenu();
      }
    });
    tray.on('right-click', () => {
      const trayMenu = [
        {
          label: '打开',
          click() {
            mainWindow.show();
          }
        },
        {
          label: '退出',
          click() {
            app.quit();
          }
        }
      ];
      // 图标的上下文菜单
      const contextMenu = Menu.buildFromTemplate(trayMenu);
      tray.popUpContextMenu(contextMenu);
    });
    tray.setToolTip('EnvoPlayer');
  })();

  /**
   * 快捷键
   */
  (function defineShortcut() {
    /**
     * Mac平台
     */
    (function mac() {
      if (DARWIN) {
        globalShortcut.register('Command+W', () => {
          mainWindow.hide();
          app.dock.hide();
        });
        globalShortcut.register('Command+Q', () => {
          app.quit();
        });
      }
    })();

    /**
     * Windows平台
     */
    (function windows() {
      if (WIN32) {
        globalShortcut.register('Control+F4', () => {
          mainWindow.hide();
          Menu.setApplicationMenu(null);
        });
      }
    })();
  })();

  /**
   * Dock/TaskBar 图标
   */
  (function taskBar() {
    if (DARWIN) {
      app.dock.setIcon(iconPath8x);
    }
    if (WIN32) {
      mainWindow.setOverlayIcon(iconPath8x);
    }
  })();

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
});
