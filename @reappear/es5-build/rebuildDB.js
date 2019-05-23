/* eslint-disable no-underscore-dangle */
Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = rebuildDB;

const _dbUtil = _interopRequireDefault(require('./dbUtil'));

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * 更新数据库
 * @returns {Promise<void>}
 */
async function rebuildDB(plan) {
  const activeCode = await _dbUtil.default.getActiveCode();

  _dbUtil.default.clear();

  await _dbUtil.default.insert({
    activeCode
  });
  await _dbUtil.default.insert({
    playerPlan: plan
  });
}
