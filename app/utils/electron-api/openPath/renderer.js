import { shell } from 'electron';

export default function openPath(filePath) {
  shell.showItemInFolder(filePath);
}
