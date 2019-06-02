import moment from 'moment';
import notification from 'antd/lib/notification';
import calcSignedUrl from './signature';
import netUtil from '../utils/netUtil';
import { macAddr as getMacAddr } from '../utils/custUtil';
import { cherryUnCached, combineAllUnCached } from './cache';
import rebuildDB from './rebuildDB';
import ApiProxy from './apiProxy';

const debug = require('debug')('api');

// 运用代理模式处理status & errorMessage
const fetchRequest = new ApiProxy();

/**
 * 注册码激活
 * @param activeCode
 * @returns {Promise<void>}
 */
export const active = async licence => {
  const macAddr = await getMacAddr();
  const res = await fetchRequest(
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
  const res = await fetchRequest(
    `/envo/api/v1/brandStore/playInfo?date=${date}`
  );
  debug('getDailyPlan请求结果：', res);
  const { data: dailyPlan } = res;

  if (!dailyPlan.playLists) {
    notification.open({
      message: '发生错误',
      description: '原因：未设置音乐歌单，请联系管理员'
    });
    return Promise.reject(Error('未设置音乐歌单'));
  }

  if (!dailyPlan.audioCarouselConfig) {
    notification.open({
      message: '发生错误',
      description: '原因：未设置轮播语音，请联系管理员'
    });
    return Promise.reject(Error('未设置轮播语音'));
  }

  if (!dailyPlan.audioCutConfigs) {
    notification.open({
      message: '发生错误',
      description: '原因：未设置插播语音，请联系管理员'
    });
    return Promise.reject(Error('未设置插播语音'));
  }

  return dailyPlan;
};

/**
 * 获取STS
 * @returns {Promise<*>}
 */
export const getSTS = async () => {
  const res = await fetchRequest('/envo/api/v1/brandStore/sts');
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
  try {
    const token = await getSTS();
    const dailyPlan = await getDailyPlan(date);
    const calcedPlan = calcSignedUrl(dailyPlan, token);
    // 更新本地数据库
    await rebuildDB(calcedPlan);
    // 检查缓存
    const allUncached = combineAllUnCached(await cherryUnCached(calcedPlan));
    debug('缓存检查结果：', allUncached);
    return allUncached;
  } catch (e) {
    throw e;
  }
};

export const reportToPortal = async info => {
  // @TODO: 实时报告播放器信息
  debug(info);
};
