import Promise from 'bluebird';
import DownloadManager from '../utils/downloadManager';

const debug = require('debug')('cache');

export function combineAllUnCached(plan) {
  const {
    unCachedPlaylists,
    unCachedScrollAudioMessage,
    unCachedAlarmAudioMessages
  } = plan;
  return [
    extractTracks(unCachedPlaylists),
    unCachedScrollAudioMessage,
    unCachedAlarmAudioMessages
  ].reduce((a, b) => a.concat(b), []);
}

export function extractTracks(playlists) {
  return playlists.reduce((a, b) => a.concat(b.tracks), []);
}

export async function cherryAll(plan) {
  const {
    cachedPlaylists,
    cachedScrollAudioMessage,
    cachedAlarmAudioMessages
  } = await cherryCached(plan);
  const {
    unCachedPlaylists,
    unCachedScrollAudioMessage,
    unCachedAlarmAudioMessages
  } = await cherryUnCached(plan);
  const res = {
    playlists: {
      cachedPlaylists,
      unCachedPlaylists
    },
    scrollAudioMessage: {
      cachedScrollAudioMessage,
      unCachedScrollAudioMessage
    },
    alarmAudioMessages: {
      cachedAlarmAudioMessages,
      unCachedAlarmAudioMessages
    }
  };
  debug('cherryAll检查结果：', res);
  return res;
}

export async function cherryCached(plan) {
  const { playlists, scrollAudioMessage, alarmAudioMessages } = plan;
  const dm = new DownloadManager();
  const cachedPlaylists = await Promise.map(playlists, async pl => {
    return { ...pl, tracks: (await dm.checkCache(pl.tracks)).cached };
  });
  const cachedScrollAudioMessage = (await dm.checkCache([scrollAudioMessage]))
    .cached;
  const cachedAlarmAudioMessages = (await dm.checkCache(alarmAudioMessages))
    .cached;
  const res = {
    cachedPlaylists,
    cachedScrollAudioMessage,
    cachedAlarmAudioMessages
  };
  debug('cherryCached检查结果：', res);
  return res;
}

export async function cherryUnCached(plan) {
  const { playlists, scrollAudioMessage, alarmAudioMessages } = plan;
  const dm = new DownloadManager();
  const unCachedPlaylists = await Promise.map(playlists, async pl => {
    return { ...pl, tracks: (await dm.checkCache(pl.tracks)).unCached };
  });
  const unCachedScrollAudioMessage = (await dm.checkCache([scrollAudioMessage]))
    .unCached;
  const unCachedAlarmAudioMessages = (await dm.checkCache(alarmAudioMessages))
    .unCached;
  const res = {
    unCachedPlaylists,
    unCachedScrollAudioMessage,
    unCachedAlarmAudioMessages
  };
  debug('cherryUnCached检查结果：', res);
  return res;
}
