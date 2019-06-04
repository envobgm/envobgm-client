import process from 'child_process';
import Promise from 'bluebird';
import os from 'os';

const macRegExp = /(([a-f0-9]{2}:)|([a-f0-9]{2}-)){5}[a-f0-9]{2}/gi;

/**
 * 获取指定URL参数
 * @param paraName
 * @returns {*}
 */
export function getUrlParam(paraName) {
  const url = document.location.toString();
  const arrObj = url.split('?');

  if (arrObj.length > 1) {
    const arrPara = arrObj[1].replace('#/', '').split('&');
    let arr;

    for (let i = 0; i < arrPara.length; i += 1) {
      arr = arrPara[i].split('=');

      if (arr != null && arr[0] === paraName) {
        return arr[1];
      }
    }
    return '';
  }

  return '';
}

/**
 * 获取随机整数
 * @param max
 * @param min
 * @returns {*}
 */
export function random(max, min) {
  return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * 指定时间内造成阻塞
 * @param callback
 * @param ms
 * @returns {Promise<void>}
 */
export async function wait(callback, ms) {
  await Promise.delay(ms || 3000).then(callback);
}

/**
 * 获取mac地址
 */
export function macAddr() {
  return new Promise((resolve, reject) => {
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
      process.exec('ipconfig/all', (error, stdout, stderr) => {
        if (error) {
          reject(stderr);
        }
        resolve(stdout.match(macRegExp)[0]);
      });
    }
  });
}
