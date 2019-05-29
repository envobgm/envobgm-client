// const debug = require('debug')('test');
const assert = require('assert');
const moment = require('moment');
const api = require('../es5-build/api');
const calcSignedUrl = require('../es5-build/signature').default;

(async function _run() {
  // const res = await api.active('7e589175f2a94fa4b4f5c205ceeb31ce');
  const token = await api.getSTS();
  const dailyPlan = await api.getDailyPlan(new Date());
  const calcedPlan = calcSignedUrl(dailyPlan, token);
  // const time = moment(1558971967 * 1000).format('YYYY-MM-DD');
  const newDate = moment(calcedPlan.setting.updateInstant).unix();
  const oldDate = moment(1558971957000).unix();

  assert(newDate > oldDate, '屌你老母！唔啱吖');
})();
