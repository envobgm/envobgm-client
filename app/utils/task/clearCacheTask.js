import schedule from 'node-schedule';
import fs from 'fs';
import os from 'os';
import moment from 'moment';
import path from 'path';
import { ipcRenderer } from 'electron';
import nedb from '../dbUtil';
import { cherryCached, extractTracks } from '../api/cache';

const debug = require('debug')('clearCacheTask');

const cachePath = path.join(os.homedir(), '.bgm');

async function deleteCache(dirPath) {
  if (fs.existsSync(dirPath)) {
    const cachedFiles = await getCachedFiles();
    fs.readdirSync(dirPath).forEach(async file => {
      const curPath = `${dirPath}/${file}`;
      if (fs.statSync(curPath).isDirectory()) {
        // recurse
        await deleteCache(curPath);
      } else {
        // delete file
        if (cachedFiles.includes(curPath)) {
          return cachedFiles.splice(cachedFiles.indexOf(curPath), 1);
        }
        if (nedb.dbPath === curPath) {
          return;
        }
        fs.unlinkSync(curPath);
      }
    });
    // fs.rmdirSync(dirPath);
  }
}

/**
 * 获取播放计划中的缓存文件列表
 * @returns {Promise<any[]>}
 */
export async function getCachedFiles() {
  const plan = await nedb.getPlayerPlan();
  const {
    cachedPlaylists,
    cachedScrollAudioMessage,
    cachedAlarmAudioMessages
  } = await cherryCached(plan);
  const cachedFiles = [
    ...extractTracks(cachedPlaylists),
    ...cachedAlarmAudioMessages,
    ...cachedScrollAudioMessage
  ].map(item => item.filePathName);
  return cachedFiles;
}

export async function clearCache() {
  await deleteCache(cachePath);
}

/**
 * 定时清理缓存作业，于每周日12点执行
 */
ipcRenderer.on('clear-task-accept', function(event) {
  event.sender.send('dispatch-to-control-panel', {
    taskStatus: false,
    type: 'clearTask',
    timeLeft: clearTaskDeadline(),
    msg: '启动定时清理作业'
  });
});
export function invokeClearTask() {
  // 每周日12点触发缓存清理任务
  debug('启动定时清理缓存作业');
  schedule.scheduleJob('0 0 12 * * 7', async () => {
    ipcRenderer.send('dispatch-to-control-panel', {
      taskStatus: true,
      type: 'clearTask',
      timeLeft: null,
      msg: '正在执行清理作业'
    });

    debug('开始执行清理缓存作业');
    await clearCache();
    debug('清理成功');

    ipcRenderer.send('dispatch-to-control-panel', {
      taskStatus: false,
      type: 'clearTask',
      timeLeft: clearTaskDeadline(),
      msg: '继续下一轮清理'
    });
  });
}

export function clearTaskDeadline() {
  return (
    moment()
      .weekday(7)
      .hour(12)
      .minute(0)
      .second(0)
      .millisecond(0)
      .unix() * 1000
  );
}
