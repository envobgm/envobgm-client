/* eslint-disable no-underscore-dangle,block-scoped-var,no-var,vars-on-top,no-plusplus,import/order */
Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.getCachedFiles = getCachedFiles;
exports.clearCache = clearCache;
exports.invokeClearTask = invokeClearTask;

const _nodeSchedule = _interopRequireDefault(require('node-schedule'));

const _fs = _interopRequireDefault(require('fs'));

const _os = _interopRequireDefault(require('os'));

const _path = _interopRequireDefault(require('path'));

const _dbUtil = _interopRequireDefault(require('../es5-build/dbUtil'));

const _cache = require('../es5-build/cache');

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function _toConsumableArray(arr) {
  return (
    _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread()
  );
}

function _nonIterableSpread() {
  throw new TypeError('Invalid attempt to spread non-iterable instance');
}

function _iterableToArray(iter) {
  if (
    Symbol.iterator in Object(iter) ||
    Object.prototype.toString.call(iter) === '[object Arguments]'
  )
    return Array.from(iter);
}

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) {
      arr2[i] = arr[i];
    }
    return arr2;
  }
}

const debug = require('debug')('clearCacheTask');

const cachePath = _path.default.join(_os.default.homedir(), '.bgm');

async function deleteCache(dirPath) {
  if (_fs.default.existsSync(dirPath)) {
    const cachedFiles = await getCachedFiles();

    _fs.default.readdirSync(dirPath).forEach(async function(file) {
      const curPath = ''.concat(dirPath, '/').concat(file);

      if (_fs.default.statSync(curPath).isDirectory()) {
        // recurse
        await deleteCache(curPath);
      } else {
        // delete file
        if (cachedFiles.includes(curPath)) {
          return cachedFiles.splice(cachedFiles.indexOf(curPath), 1);
        }

        if (_dbUtil.default.dbPath === curPath) {
          return;
        }

        _fs.default.unlinkSync(curPath);
      }
    }); // fs.rmdirSync(dirPath);
  }
}

/**
 * 获取播放计划中的缓存文件列表
 * @returns {Promise<any[]>}
 */

async function getCachedFiles() {
  const plan = await _dbUtil.default.getPlayerPlan();

  const _ref = await (0, _cache.cherryCached)(plan);
  const { cachedPlaylists } = _ref;
  const { cachedScrollAudioMessage } = _ref;
  const { cachedAlarmAudioMessages } = _ref;

  const cachedFiles = []
    .concat(
      _toConsumableArray((0, _cache.extractTracks)(cachedPlaylists)),
      _toConsumableArray(cachedAlarmAudioMessages),
      _toConsumableArray(cachedScrollAudioMessage)
    )
    .map(function(item) {
      return item.filePathName;
    });
  return cachedFiles;
} // @TODO: 现在是全部清空，容易招致BUG，后面可以选择性清空

async function clearCache() {
  await deleteCache(cachePath);
}

/**
 * 定时清除缓存作业，于每月的30号21点执行
 */

function invokeClearTask() {
  // 每月的30号晚上9点触发缓存清除任务
  _nodeSchedule.default.scheduleJob('0 0 21 30 * *', async function() {
    debug('开始执行清除缓存作业');
    await clearCache();
    debug('清除成功');
  });
}

(async function _run() {
  await clearCache();
})();
