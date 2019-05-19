import moment from 'moment';
import calcSignedUrl from './signature';
import netUtil from '../utils/netUtil';
import { macAddr as getMacAddr } from '../utils/cust';
import { cherryUnCached } from './cache';
import rebuildDB from './rebuildDB';

const debug = require('debug')('api');

/**
 * 注册码激活
 * @param activeCode
 * @returns {Promise<void>}
 */
export const active = async activeCode => {
  const mac = await getMacAddr();
  const res = await netUtil.fetchRequest(
    `/siteapi/${mac}/active/${activeCode}`,
    netUtil.PUT
  );
  debug('active请求结果：', res);
  return res;
};

/**
 * 获取指定日播放计划
 * @param specDate
 * @returns {Promise<*>}
 */
export const getDailyPlan = async specDate => {
  const mac = await getMacAddr();
  const date = moment(specDate).format('YYYY-MM-DD');
  const res = await netUtil.fetchRequest(
    `/siteapi/${mac}/playerInfo?date=${date}`
  );
  debug('getDailyPlan请求结果：', res);
  return res.content.dailyPlan;
};

/**
 * 获取STS
 * @returns {Promise<*>}
 */
export const getSTS = async () => {
  const mac = await getMacAddr();
  const res = await netUtil.fetchRequest(
    `/ossapi/requestDownloadAK/${mac}`,
    netUtil.POST
  );
  debug('getSTS请求结果：', res);
  return res.content.token;
};

/**
 * 更新播放计划
 * @param date
 * @returns {Promise<*>}
 */
export const updateDailyPlan = async date => {
  const token = await getSTS();
  const dailyPlan = await getDailyPlan(date);
  const calcedPlan = calcSignedUrl(dailyPlan, token);
  // 更新本地数据库
  await rebuildDB(calcedPlan);
  // 检查缓存
  const res = await cherryUnCached(calcedPlan);
  const arr = Object.values(res).reduce((a, b) => a.concat(b), []);
  debug('缓存检查结果：', arr);
  return arr;
};
