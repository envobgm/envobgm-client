import schedule from 'node-schedule';
import fs from 'fs';
import os from 'os';
import path from 'path';
import nedb from '../utils/dbUtil';
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
 * 定时清除缓存作业，于每月的30号21点执行
 */
export function invokeClearTask() {
  // 每月的30号晚上9点触发缓存清除任务
  schedule.scheduleJob('0 0 21 30 * *', async () => {
    debug('开始执行清除缓存作业');
    await clearCache();
    debug('清除成功');
  });
}
