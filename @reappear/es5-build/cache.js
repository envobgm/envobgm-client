/* eslint-disable no-underscore-dangle,import/order,new-cap */
Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.combineAllUnCached = combineAllUnCached;
exports.extractTracks = extractTracks;
exports.cherryAll = cherryAll;
exports.cherryCached = cherryCached;
exports.cherryUnCached = cherryUnCached;

const _bluebird = _interopRequireDefault(require('bluebird'));

const _downloadManager = _interopRequireDefault(require('./downloadManager'));

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

const debug = require('debug')('cache');

function combineAllUnCached(plan) {
  const { unCachedPlaylists } = plan;
  const { unCachedScrollAudioMessage } = plan;
  const { unCachedAlarmAudioMessages } = plan;
  return [
    extractTracks(unCachedPlaylists),
    unCachedScrollAudioMessage,
    unCachedAlarmAudioMessages
  ].reduce(function(a, b) {
    return a.concat(b);
  }, []);
}

function extractTracks(playlists) {
  return playlists.reduce(function(a, b) {
    return a.concat(b.tracks);
  }, []);
}

async function cherryAll(plan) {
  const _ref = await cherryCached(plan);
  const { cachedPlaylists } = _ref;
  const { cachedScrollAudioMessage } = _ref;
  const { cachedAlarmAudioMessages } = _ref;

  const _ref2 = await cherryUnCached(plan);
  const { unCachedPlaylists } = _ref2;
  const { unCachedScrollAudioMessage } = _ref2;
  const { unCachedAlarmAudioMessages } = _ref2;

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

async function cherryCached(plan) {
  const { playlists } = plan;
  const { scrollAudioMessage } = plan;
  const { alarmAudioMessages } = plan;
  const dm = new _downloadManager.default();
  const cachedPlaylists = await _bluebird.default.map(playlists, async function(
    pl
  ) {
    return {
      ...pl,
      tracks: (await dm.checkCache(pl.tracks)).cached
    };
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

async function cherryUnCached(plan) {
  const { playlists } = plan;
  const { scrollAudioMessage } = plan;
  const { alarmAudioMessages } = plan;
  const dm = new _downloadManager.default();
  const unCachedPlaylists = await _bluebird.default.map(
    playlists,
    async function(pl) {
      return {
        ...pl,
        tracks: (await dm.checkCache(pl.tracks)).unCached
      };
    }
  );
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
