const moment = require('moment');
const sinon = require('sinon');

const date = new Date('2019-06-13 01:19:58');
const clock = sinon.useFakeTimers(date);

clock.tick(4000);

const alarmTime = moment('01:20:00', 'HH:mm:ss');
const now = moment();
const now1 = moment();
now1.hours(alarmTime.hours());
now1.minutes(alarmTime.minutes());
now1.seconds(alarmTime.seconds());
const diff = Math.abs(now1.diff(now, 'milliseconds'));

console.log(diff);
