import { shell } from 'electron';

export default function openLink(link) {
  shell.openExternal(link);
}
