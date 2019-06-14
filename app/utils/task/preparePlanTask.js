import { ipcRenderer } from 'electron';
import schedule from 'node-schedule';
import moment from 'moment';
import path from 'path';
import os from 'os';
import Datastore from 'nedb';
import fs from 'fs';
import DownloadManager from '../download/downloadManager';
import nedb from '../dbUtil';
import { getDailyPlan, getSTS } from '../api/index';
import { cherryUnCached, extractTracks } from '../api/cache';
import calcSignedUrl from '../api/signature';

const debug = require('debug')('preparePlanTask');

const dm = new DownloadManager();

/**
 * 下载缓存
 * @param plan
 * @returns {Promise<void>}
 */
export async function downloadCache(plan) {
  const {
    unCachedPlaylists,
    unCachedScrollAudioMessage,
    unCachedAlarmAudioMessages
  } = await cherryUnCached(plan);
  const allUnCached = [
    ...extractTracks(unCachedPlaylists),
    ...unCachedScrollAudioMessage,
    ...unCachedAlarmAudioMessages
  ];
  await dm.downloadSeries(allUnCached);
}

/**
 * 检查预缓存
 * @param date
 * @returns {Promise<void>}
 */
export async function preparePlan() {
  /**
   * 远程获取第二天播放计划，比较版本号:
   *  有版本更新
   *      1.创建预缓存数据文件，例如2019-05-05.db，并存储播放数据
   *      2.当播放器启动或者进行更新时，在原有的逻辑基础上，优先检查是前面预缓存的当天的内容，cover标准数据库文件
   *
   *  无版本更新
   */
  const planDate = moment().add(1, 'days');
  debug(
    `今天${moment().format('DD')}号，查看${planDate.format('DD')}号有无更新计划`
  );
  let plan = await getDailyPlan(planDate);
  const token = await getSTS();
  plan = calcSignedUrl(plan, token);
  const cachePlan = await nedb.getPlayerPlan();
  const activeCode = await nedb.getActiveCode();
  if (
    moment(cachePlan.setting.updateInstant).unix() <
    moment(plan.setting.updateInstant).unix()
  ) {
    debug('发现新的播放计划 ', plan);
    debug('正在进行预加载...');
    const dbPath = path.join(
      os.homedir(),
      '.bgm',
      `${planDate.format('YYYY-MM-DD')}.db`
    );
    // 缓存过的就不需要缓存
    if (!fs.existsSync(dbPath)) {
      // 数据缓存
      const db = new Datastore({ filename: dbPath, autoload: true });
      await db.insert({ activeCode });
      await db.insert({ playerPlan: plan });
      // 音轨缓存
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
ipcRenderer.on('prepare-task-accept', function(event) {
  event.sender.send('dispatch-to-control-panel', {
    taskStatus: false,
    type: 'prepareTask',
    timeLeft: prepareTaskDeadline(),
    msg: '启动定时缓存作业'
  });
});
export function invokePrepareTask() {
  // 整点触发一次
  debug('启动定时预缓存作业');
  schedule.scheduleJob('0 0 * * * *', async () => {
    ipcRenderer.send('dispatch-to-control-panel', {
      taskStatus: true,
      type: 'prepareTask',
      timeLeft: null,
      msg: '正在执行缓存作业'
    });

    debug('开始执行预缓存作业');
    await preparePlan();

    ipcRenderer.send('dispatch-to-control-panel', {
      taskStatus: false,
      type: 'prepareTask',
      timeLeft: prepareTaskDeadline(),
      msg: '继续下一轮缓存'
    });
  });
}

/**
 * 检查当天是否有可以使用的预缓存，并替换最新
 * @returns {Promise<void>}
 */
export async function checkPlan(specDate) {
  const newPlanPath = path.join(
    os.homedir(),
    '.bgm',
    `${moment(specDate).format('YYYY-MM-DD')}.db`
  );
  if (fs.existsSync(newPlanPath)) {
    debug('发现新的播放计划：', newPlanPath);
    const planPath = nedb.dbPath;
    // 删除旧缓存
    fs.unlinkSync(planPath);
    debug('删除旧缓存：', planPath);
    // 重建缓存，新的播放计划替代旧的计划
    fs.renameSync(newPlanPath, planPath);
    return true;
  }
  debug(`${moment(specDate).format('DD')}号没有新的播放计划`);
  return false;
}

export function prepareTaskDeadline() {
  return (
    moment()
      .endOf('hour')
      .unix() * 1000
  );
}
