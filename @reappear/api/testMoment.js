// const sinon = require('sinon');
// const schedule = require('node-schedule');
//
// const now = new Date('2019-06-09 11:59:59');
// const clock = sinon.useFakeTimers(now);
//
// schedule.scheduleJob('0 0 12 * * 7', function() {
//   console.log('执行作业');
// });
//
// clock.tick(1000 * 60);
//
// clock.restore();

// const moment = require('moment');
//
// const weekOfday = moment().format('E'); // 计算今天是这周第几天
// const last_monday = moment()
//   .subtract(weekOfday + 7 - 1, 'days')
//   .format('YYYY/MM/DD'); // 周一日期
// const last_sunday = moment()
//   .subtract(weekOfday, 'days')
//   .format('YYYY/MM/DD'); // 周日日期
//
// console.log(last_monday);
// console.log(last_sunday);
//
// console.log(
//   moment()
//     .weekday(7)
//     .hour(12)
//     .minute(0)
//     .second(0)
//     .millisecond(0)
//     .unix() * 1000
// );
