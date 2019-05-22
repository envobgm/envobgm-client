/* eslint-disable no-unused-vars */
const schedule = require('node-schedule');
// const sinon = require('sinon');
const moment = require('moment');

// const now = new Date('2019-05-05 20:59:58');
// const clock = sinon.useFakeTimers(now);

const path = require('path');
const os = require('os');
const Datastore = require('nedb');
const fs = require('fs');

const mockData = {
  plan: { name: 'ppp' },
  date: new Date('2019-05-10 19:53:58')
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
  const today = moment().unix();
  const planDate = moment(date).unix();
  if (planDate > today) {
    const dbPath = path.join(
      os.homedir(),
      '.bgm',
      `${moment(date).format('YYYY-MM-DD')}.db`
    );
    // 缓存过的就不需要缓存
    if (!fs.existsSync(dbPath)) {
      // 数据缓存
      const db = new Datastore({ filename: dbPath, autoload: true });
      db.insert({ playerPlan: mockData });
    }
  } else {
    console.info('没事可做');
  }
};
// 每月的30号晚上9点触发缓存清除任务
// schedule.scheduleJob('0 0 */3 * * *', async () => {
//     console.log('触发整点定时任务');
//     await preparePlan(mockData.date);
// });

(async function f() {
  await preparePlan(mockData.date);
})();

// clock.tick(1000 * 2);
