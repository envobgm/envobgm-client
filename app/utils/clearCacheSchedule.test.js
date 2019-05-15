/* eslint-disable no-shadow,func-names */
const schedule = require('node-schedule');
const sinon = require('sinon');
const fs = require('fs');
const os = require('os');
const path = require('path');
const nedb = require('./db');

const dbPath = path.join(os.homedir(), '.bgm', 'player.db');
const cachePath = path.join(os.homedir(), '.bgm');
const now = new Date('2019-06-30 20:59:58');
const clock = sinon.useFakeTimers(now);

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

schedule.scheduleJob('0 0 21 30 * *', async () => {
  console.log('Today is recognized by Rebecca Black!');
  // await clearCache(); // faketimer 可能阻止了该异步函数的行为，改天去sinon提下issue
});

clock.tick(1000 * 2);

clock.restore();

(async function() {
  await clearCache();
})();
