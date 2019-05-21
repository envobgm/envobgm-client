/* eslint-disable no-restricted-syntax,no-await-in-loop */
import schedule from 'node-schedule';
import moment from 'moment';
import { getDailyPlan } from '../../api/index';
import nedb from '../db';
import DownloadManager from '../download/downloadManager';

const path = require('path');
const os = require('os');
const Datastore = require('nedb');
const fs = require('fs');

const checkCache = async p => {
  const {
    playlists,
    scrollAudioMessage,
    alarmAudioMessages,
    setting,
    site
  } = p;
  const dm = new DownloadManager();
  const cPlaylists = [];
  for (const playlist of playlists) {
    cPlaylists.push({
      ...playlist,
      tracks: await dm.checkCache(playlist.tracks)
    });
  }
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
  const dm = new DownloadManager();
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

export default function invokePrepareSchedule() {
  // 每月的30号晚上9点触发缓存清除任务
  schedule.scheduleJob('0 0 * * * *', async () => {
    await preparePlan();
  });
}
