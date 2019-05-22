import schedule from 'node-schedule';
import fs from 'fs';
import os from 'os';
import path from 'path';
import nedb from '../utils/dbUtil';

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

const clearCache = async function() {
  // 保存激活码
  const activeCode = await nedb.getActiveCode();
  // 清除缓存
  deleteFolderRecursive(cachePath);
  // 重建缓存
  fs.mkdir(cachePath, err => {
    if (err) {
      //
    }
  });
  fs.writeFileSync(dbPath, '', { encoding: 'utf-8' });
  nedb().insert({ activeCode });
};

/**
 * 定时清除缓存作业，于每月的30号21点执行
 */
export default function invokeClearTask() {
  // 每月的30号晚上9点触发缓存清除任务
  schedule.scheduleJob('0 0 21 30 * *', async () => {
    await clearCache();
  });
}
