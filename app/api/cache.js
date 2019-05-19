// export async function all() {}

import Promise from 'bluebird';
import DownloadManager from '../utils/downloadManager';

const debug = require('debug')('cache');

export async function cherryCached() {
  console.log('hello');
}

export async function cherryUnCached(plan) {
  const { playlists, scrollAudioMessage, alarmAudioMessages } = plan;
  const dm = new DownloadManager();
  const unCachedPlaylist = await Promise.map(
    playlists,
    async ({ tracks }) => (await dm.checkCache(tracks)).unCached
  );
  const unCachedPlaylistTracks = unCachedPlaylist.reduce(
    (a, b) => a.concat(b),
    []
  );
  const unCachedScrollAudioMessage = (await dm.checkCache([scrollAudioMessage]))
    .unCached;
  const unCachedAlarmAudioMessages = (await dm.checkCache(alarmAudioMessages))
    .unCached;
  const res = {
    unCachedPlaylistTracks,
    unCachedScrollAudioMessage,
    unCachedAlarmAudioMessages
  };
  debug('cherryUnCached检查结果：', res);
  return res;
}
