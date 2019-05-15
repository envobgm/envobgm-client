/* eslint-disable no-return-await */
const Promise = require('bluebird');
const process = require('child_process');
const os = require('os');

const macRegExp = /(([a-f0-9]{2}:)|([a-f0-9]{2}-)){5}[a-f0-9]{2}/gi;

const cust = {};

// 延迟执行
cust.wait = async (callback, ms) =>
  await Promise.delay(ms || 3000).then(callback);

// 获取mac地址
cust.macAddr = async () =>
  await new Promise((resolve, reject) => {
    // Mac | Linux
    if (os.platform() === 'darwin' || os.platform() === 'linux') {
      process.exec('ifconfig', (error, stdout, stderr) => {
        if (error) {
          reject(stderr);
        }
        resolve(stdout.match(macRegExp)[0]);
      });
    }
    // Windows
    else {
      process.exec('ipconfig', (error, stdout, stderr) => {
        if (error) {
          reject(stderr);
        }
        resolve(stdout.match(macRegExp)[0]);
      });
    }
  });

module.exports = cust;
