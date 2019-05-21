/* eslint-disable no-shadow,func-names */
import schedule from 'node-schedule';
import nedb from '../db';

const fs = require('fs');
const os = require('os');
const path = require('path');

const dbPath = path.join(os.homedir(), '.bgm', 'player.db');
const cachePath = path.join(os.homedir(), '.bgm');

const deleteFolderRecursive = function(path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(file => {
      const curPath = `${path}/${file}`;
      if (fs.statSync(curPath).isDirectory()) {
        // recurse
        deleteFolderRecursive(curPath);
      } else {
        // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
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

export default function invokeClearSchedule() {
  // 每月的30号晚上9点触发缓存清除任务
  schedule.scheduleJob('0 0 21 30 * *', async () => {
    await clearCache();
  });
}
