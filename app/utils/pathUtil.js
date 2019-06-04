import path from 'path';
import os from 'os';
import { shell } from 'electron';
import { productName } from '../../package';

export function open(filePath) {
  shell.showItemInFolder(filePath);
}

export function cachePath() {
  return path.join(os.homedir(), '.bgm', 'player.db');
}

export function logPath() {
  if (os.platform() === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Logs', productName, 'log.log');
  }
  return path.join(os.homedir(), 'AppData', 'Roaming', productName, 'log.log');
}
