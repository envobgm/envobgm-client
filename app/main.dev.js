/* eslint-disable no-unused-expressions,prettier/prettier */
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
import { app, BrowserWindow, globalShortcut, ipcMain, Menu, nativeImage, Tray } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import log from 'electron-log';
import os from 'os';
import MenuBuilder from './menu';
import ipcs from './constants/ipcs';
import tray from './constants/tray';

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    // @see: https://blog.csdn.net/Wonder233/article/details/80563236
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow = null;
let appTray = null;
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
      height: 728,
      webPreferences: {
        nodeIntegration: true,
        nodeIntegrationInWorker: true
      }
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
    (function events() {
    })();
  })();

  /**
   * 托盘对象
   */
  (function makeTray() {
    const image = nativeImage.createFromPath(iconPath);
    appTray = new Tray(image);
    appTray.setToolTip('EnvoPlayer');

    /**
     * 注册托盘事件
     */
    (function registerEvents() {
      appTray.on(tray.DOUBLE_CLICK, () => {
        mainWindow.show();
        if (DARWIN) {
          app.dock.show();
        }
        if (WIN32) {
          const menuBuilder = new MenuBuilder(mainWindow);
          menuBuilder.buildMenu();
        }
      });
      appTray.on(tray.RIGHT_CLICK, () => {
        const trayMenu = [
          {
            label: '打开',
            click() {
              mainWindow.show();
              if (DARWIN) {
                app.dock.show();
              }
              if (WIN32) {
                const menuBuilder = new MenuBuilder(mainWindow);
                menuBuilder.buildMenu();
              }
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
        appTray.popUpContextMenu(contextMenu);
      });
    })();
  })();

  /**
   * 快捷键
   */
  (function defineShortcut() {
    (function mac() {
      globalShortcut.register('CommandOrControl+3', () => {
        mainWindow.show();
        if (DARWIN) {
          app.dock.show();
        }
        if (WIN32) {
          const menuBuilder = new MenuBuilder(mainWindow);
          menuBuilder.buildMenu();
        }
      });
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

  /**
   * 调用IPC进程
   */
  (function invokeIpcProcess() {
    // 关闭窗口
    ipcMain.on(ipcs.CLOSE, event => {
      event.preventDefault();
      mainWindow.hide();
      DARWIN ? app.dock.hide() : Menu.setApplicationMenu(null);
    });
    // 重置窗口大小
    ipcMain.on(ipcs.RESIZE, (event, w, h) => {
      mainWindow.setMinimumSize(w, h);
      mainWindow.setMaximumSize(w, h);
      mainWindow.setSize(w, h);
      mainWindow.center();
    });
    // 窗口最小化
    ipcMain.on(ipcs.HIDE, mainWindow.minimize.bind(mainWindow));
    // 窗口最大化
    ipcMain.on(ipcs.MAXIMIZE, mainWindow.maximize.bind(mainWindow));
  })();

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
});
