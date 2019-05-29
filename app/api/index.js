import moment from 'moment';
import calcSignedUrl from './signature';
import netUtil from '../utils/netUtil';
import { macAddr as getMacAddr } from '../utils/custUtil';
import { cherryUnCached, combineAllUnCached } from './cache';
import rebuildDB from './rebuildDB';

const debug = require('debug')('api');

/**
 * 注册码激活
 * @param activeCode
 * @returns {Promise<void>}
 */
export const active = async licence => {
  const macAddr = await getMacAddr();
  const res = await netUtil.fetchRequest(
    '/envo/api/v1/brandStore/active',
    netUtil.PATCH,
    { licence, macAddr }
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
  const date = moment(specDate).format('YYYY-MM-DD');
  const res = await netUtil.fetchRequest(
    `/envo/api/v1/brandStore/playInfo?date=${date}`
  );
  debug('getDailyPlan请求结果：', res);
  const { data: dailyPlan } = res;
  return dailyPlan;
};

/**
 * 获取STS
 * @returns {Promise<*>}
 */
export const getSTS = async () => {
  const res = await netUtil.fetchRequest('/envo/api/v1/brandStore/sts');
  debug('getSTS请求结果：', res);
  res.data.region = 'oss-cn-shanghai';
  return res.data;
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
  const allUncached = combineAllUnCached(await cherryUnCached(calcedPlan));
  debug('缓存检查结果：', allUncached);
  return allUncached;
};
