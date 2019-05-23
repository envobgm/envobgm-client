/* eslint-disable no-underscore-dangle,no-unused-vars,no-var,vars-on-top,block-scoped-var,import/order,new-cap,no-plusplus,global-require */
Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.downloadCache = downloadCache;
exports.preparePlan = preparePlan;
exports.invokePrepareTask = invokePrepareTask;
exports.checkPlan = checkPlan;

const _nodeSchedule = _interopRequireDefault(require('node-schedule'));

const _moment = _interopRequireDefault(require('moment'));

const _path = _interopRequireDefault(require('path'));

const _os = _interopRequireDefault(require('os'));

const _nedb = _interopRequireDefault(require('nedb'));

const _fs = _interopRequireDefault(require('fs'));

const _downloadManager = _interopRequireDefault(
  require('../es5-build/downloadManager')
);

const _dbUtil = _interopRequireDefault(require('../es5-build/dbUtil'));

const _api = require('../es5-build/api');

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

const debug = require('debug')('preparePlanTask');

const dm = new _downloadManager.default();
/**
 * 下载缓存
 * @param plan
 * @returns {Promise<void>}
 */

async function downloadCache(plan) {
  const _ref = await (0, _cache.cherryUnCached)(plan);
  const { unCachedPlaylists } = _ref;
  const { unCachedScrollAudioMessage } = _ref;
  const { unCachedAlarmAudioMessages } = _ref;

  const allUnCached = [].concat(
    _toConsumableArray((0, _cache.extractTracks)(unCachedPlaylists)),
    _toConsumableArray(unCachedScrollAudioMessage),
    _toConsumableArray(unCachedAlarmAudioMessages)
  );
  await dm.downloadSeries(allUnCached);
}
/**
 * 检查预缓存
 * @param date
 * @returns {Promise<void>}
 */

async function preparePlan() {
  /**
   * 远程获取第二天播放计划，比较版本号:
   *  有版本更新
   *      1.创建预缓存数据文件，例如2019-05-05.db，并存储播放数据
   *      2.当播放器启动或者进行更新时，在原有的逻辑基础上，优先检查是前面预缓存的当天的内容，cover标准数据库文件
   *
   *  无版本更新
   */
  const planDate = (0, _moment.default)().add(1, 'days');
  debug(
    '\u4ECA\u5929'
      .concat((0, _moment.default)().format('DD'), '\u53F7\uFF0C\u67E5\u770B')
      .concat(
        planDate.format('DD'),
        '\u53F7\u6709\u65E0\u66F4\u65B0\u8BA1\u5212'
      )
  );
  const plan = await require('./mockData').playerPlan;
  const cachePlan = await _dbUtil.default.getPlayerPlan();
  const activeCode = await _dbUtil.default.getActiveCode();

  if (
    (0, _moment.default)(cachePlan.updateDate).unix() <
    (0, _moment.default)(plan.updateDate).unix()
  ) {
    debug('发现新的播放计划 ', plan);
    debug('正在进行预加载...');

    const dbPath = _path.default.join(
      _os.default.homedir(),
      '.bgm',
      ''.concat(
        (0, _moment.default)(plan.updateDate).format('YYYY-MM-DD'),
        '.db'
      )
    ); // 缓存过的就不需要缓存

    if (!_fs.default.existsSync(dbPath)) {
      // 数据缓存
      const db = new _nedb.default({
        filename: dbPath,
        autoload: true
      });
      await db.insert({
        activeCode
      });
      await db.insert({
        playerPlan: plan
      }); // 音轨缓存

      await downloadCache(plan);
      debug('缓存成功');
      return true;
    }

    debug('已缓存');
    return false;
  }

  debug('没有可更新的播放计划');
  return false;
}
/**
 * 预缓存作业，整点执行一次
 */

function invokePrepareTask() {
  // 整点触发一次
  _nodeSchedule.default.scheduleJob('0 0 * * * *', async function() {
    debug('开始执行预缓存作业');
    await preparePlan();
    debug('缓存成功');
  });
}
/**
 * 检查当天是否有可以使用的预缓存，并替换最新
 * @returns {Promise<void>}
 */

async function checkPlan(specDate) {
  const newPlanPath = _path.default.join(
    _os.default.homedir(),
    '.bgm',
    ''.concat((0, _moment.default)(specDate).format('YYYY-MM-DD'), '.db')
  );

  if (_fs.default.existsSync(newPlanPath)) {
    debug('发现新的播放计划：', newPlanPath);
    const planPath = _dbUtil.default.dbPath; // 删除旧缓存

    _fs.default.unlinkSync(planPath);

    debug('删除旧缓存：', planPath); // 重建缓存，新的播放计划替代旧的计划

    _fs.default.renameSync(newPlanPath, planPath);

    return true;
  }

  debug(
    ''.concat(
      (0, _moment.default)(specDate).format('DD'),
      '\u53F7\u6CA1\u6709\u65B0\u7684\u64AD\u653E\u8BA1\u5212'
    )
  );
  return false;
}
