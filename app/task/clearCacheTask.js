import schedule from 'node-schedule';
import fs from 'fs';
import os from 'os';
import path from 'path';
import nedb from '../utils/dbUtil';

const debug = require('debug')('clearCacheTask');

const dbPath = path.join(os.homedir(), '.bgm', 'player.db');
const cachePath = path.join(os.homedir(), '.bgm');

const deleteFolderRecursive = function(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach(file => {
      const curPath = `${dirPath}/${file}`;
      if (fs.statSync(curPath).isDirectory()) {
        // recurse
        deleteFolderRecursive(curPath);
      } else {
        // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dirPath);
  }
};

// @TODO: 现在是全部清空，容易招致BUG，后面可以选择性清空
export async function clearCache() {
  try {
    // 保存激活码
    const activeCode = await nedb.getActiveCode();
    // 清除缓存
    deleteFolderRecursive(cachePath);
    // 重建缓存
    fs.mkdirSync(cachePath, err => {
      if (err) {
        //
      }
    });
    fs.writeFileSync(dbPath, '', { encoding: 'utf-8' });
    await nedb.insert({ activeCode });
    return true;
  } catch (e) {
    debug(e.toString());
    return false;
  }
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
