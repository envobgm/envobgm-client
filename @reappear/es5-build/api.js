/* eslint-disable no-void,no-underscore-dangle,import/order */
Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.updateDailyPlan = exports.getSTS = exports.getDailyPlan = exports.active = void 0;

const _moment = _interopRequireDefault(require('moment'));

const _signature = _interopRequireDefault(require('./signature'));

const _netUtil = _interopRequireDefault(require('./netUtil'));

const _custUtil = require('./custUtil');

const _cache = require('./cache');

const _rebuildDB = _interopRequireDefault(require('./rebuildDB'));

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

const debug = require('debug')('api');
/**
 * 注册码激活
 * @param activeCode
 * @returns {Promise<void>}
 */

const active = async function active(activeCode) {
  const mac = await (0, _custUtil.macAddr)();
  const res = await _netUtil.default.fetchRequest(
    '/siteapi/'.concat(mac, '/active/').concat(activeCode),
    _netUtil.default.PUT
  );
  debug('active请求结果：', res);
  return res;
};
/**
 * 获取指定日播放计划
 * @param specDate
 * @returns {Promise<*>}
 */

exports.active = active;

const getDailyPlan = async function getDailyPlan(specDate) {
  const mac = await (0, _custUtil.macAddr)();
  const date = (0, _moment.default)(specDate).format('YYYY-MM-DD');
  const res = await _netUtil.default.fetchRequest(
    '/siteapi/'.concat(mac, '/playerInfo?date=').concat(date)
  );
  debug('getDailyPlan请求结果：', res);
  return res.content.dailyPlan;
};
/**
 * 获取STS
 * @returns {Promise<*>}
 */

exports.getDailyPlan = getDailyPlan;

const getSTS = async function getSTS() {
  const mac = await (0, _custUtil.macAddr)();
  const res = await _netUtil.default.fetchRequest(
    '/ossapi/requestDownloadAK/'.concat(mac),
    _netUtil.default.POST
  );
  debug('getSTS请求结果：', res);
  return res.content.token;
};
/**
 * 更新播放计划
 * @param date
 * @returns {Promise<*>}
 */

exports.getSTS = getSTS;

const updateDailyPlan = async function updateDailyPlan(date) {
  const token = await getSTS();
  const dailyPlan = await getDailyPlan(date);
  const calcedPlan = (0, _signature.default)(dailyPlan, token); // 更新本地数据库

  await (0, _rebuildDB.default)(calcedPlan); // 检查缓存

  const allUncached = (0, _cache.combineAllUnCached)(
    await (0, _cache.cherryUnCached)(calcedPlan)
  );
  debug('缓存检查结果：', allUncached);
  return allUncached;
};

exports.updateDailyPlan = updateDailyPlan;
