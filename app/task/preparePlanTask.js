import schedule from 'node-schedule';
import moment from 'moment';
import Promise from 'bluebird';
import path from 'path';
import os from 'os';
import Datastore from 'nedb';
import fs from 'fs';
import DownloadManager from '../download/downloadManager';
import nedb from '../utils/dbUtil';
import { getDailyPlan } from '../api/index';

const dm = new DownloadManager();

const checkCache = async p => {
  const {
    playlists,
    scrollAudioMessage,
    alarmAudioMessages,
    setting,
    site
  } = p;
  const cPlaylists = await Promise.map(playlists, async pl => {
    return {
      ...pl,
      tracks: await dm.checkCache(pl.tracks)
    };
  });
  const cScrollAudioMessage = await dm.checkCache([scrollAudioMessage]);
  const cAlarmAudioMessages = await dm.checkCache(alarmAudioMessages);
  return {
    cPlaylists,
    cScrollAudioMessage,
    cAlarmAudioMessages,
    setting,
    site
  };
};

const downloadCache = async res => {
  const unCachedTracks = res.cPlaylists.reduce(
    (a, b) => a.concat(b.tracks.unCached),
    []
  );
  const unCachedAlarms = res.cAlarmAudioMessages.unCached;
  const unCachedScrolls = res.cScrollAudioMessage.unCached;
  await dm.downloadSeries([
    ...unCachedTracks,
    ...unCachedAlarms,
    ...unCachedScrolls
  ]);
};

const preparePlan = async date => {
  /**
   * 远程获取第二天播放计划，比较版本号:
   *  有版本更新
   *      1.创建预缓存数据文件，例如2019-05-05.db，并存储播放数据
   *      2.当播放器启动或者进行更新时，在原有的逻辑基础上，优先检查是前面预缓存的当天的内容，cover标准数据库文件
   *
   *  无版本更新
   */
  const planDate = moment(date).add(1, 'days');
  const plan = await getDailyPlan(planDate);
  const cachePlan = await nedb.getPlayerPlan();
  if (moment(cachePlan.updateDate).unix() < moment(plan.updateDate).unix()) {
    console.debug('发现新的播放计划 ', plan);
    console.debug('正在进行预加载...');
    const dbPath = path.join(
      os.homedir(),
      '.bgm',
      `${moment(date).format('YYYY-MM-DD')}.db`
    );
    // 缓存过的就不需要缓存
    if (!fs.existsSync(dbPath)) {
      // 数据缓存
      const db = new Datastore({ filename: dbPath, autoload: true });
      db.insert({ playerPlan: plan });
      // 音轨缓存
      const res = await checkCache(plan);
      await downloadCache(res);
      console.debug('加载成功');
    } else {
      console.debug('已缓存过了');
    }
  } else {
    console.debug('没事可做');
  }
};

/**
 * 预缓存作业，整点执行一次
 */
export function invokePrepareTask() {
  // 每月的30号晚上9点触发缓存清除任务
  schedule.scheduleJob('0 0 * * * *', async () => {
    await preparePlan();
  });
}

/**
 * 检查当天是否有可以使用的预缓存，并替换最新
 * @returns {Promise<void>}
 */
export async function checkPlan() {
  const newPlanPath = path.join(
    os.homedir(),
    '.bgm',
    `${moment().format('YYYY-MM-DD')}.db`
  );
  if (fs.existsSync(newPlanPath)) {
    console.debug('发现新的播放计划');
    const activeCode = await nedb.getActiveCode();
    const planPath = nedb.dbPath;
    // 删除旧缓存
    fs.unlinkSync(planPath);
    // 存储激活码
    const db = new Datastore({ filename: newPlanPath, autoload: true });
    db.insert({ activeCode });
    // 重建缓存，新的播放计划替代旧的计划
    fs.renameSync(newPlanPath, planPath);
  }
}
