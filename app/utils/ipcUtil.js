import { remote } from 'electron';
import ipcs from '../constants/ipcs';

export function log(info) {
  const { controlPanelId } = remote.getGlobal('windowManager');
  if (controlPanelId) {
    remote.BrowserWindow.fromId(controlPanelId).webContents.send(
      ipcs.PLAY_INFO,
      info
    );
  }
}

export function empty() {}
