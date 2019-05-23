/* eslint-disable promise/always-return,no-plusplus,no-underscore-dangle,no-param-reassign,class-methods-use-this,no-return-await,eqeqeq */
/**
 * Created by shenyin.sy on 17/8/22.
 */

import os from 'os';
import path from 'path';
import startFS from 'file-system';
import FS from 'fs';
import EventEmitter from 'events';
import download from 'download';
import Debug from 'debug';
import Promise from 'bluebird';
import crypto from 'crypto';

const debug = Debug('downloadManager');

const fs = Promise.promisifyAll(FS);
// 检查是否下载了所有音乐，如果没有提示用户：有没有下载的音乐，是否立刻下载 | 取消播放 | 定时下载
// 所以当全部音乐准备好之前，是不会播放的。

export default class DownloadManager extends EventEmitter {
  constructor(playlist, dir) {
    super();
    this._cached = [];
    this._unCached = [];
    this._playlist = playlist;
    this._dir = dir || path.join(os.homedir(), '.bgm');
  }

  // 检查没有本地缓存的文件
  checkCache(playlist) {
    const obj = {
      cached: [],
      unCached: []
    };
    return Promise.reduce(
      this._playlist || playlist,
      async (result, item) => {
        const fileName = (item.filePathName = path.join(this._dir, item.title));
        return await new Promise(resolve => {
          fs.exists(fileName, exists => {
            if (exists) {
              const rs = fs.createReadStream(fileName);
              const hash = crypto.createHash('md5');
              rs.on('data', hash.update.bind(hash));
              rs.on('end', () => {
                const md5 = hash.digest('hex').toUpperCase();
                // 删除不完整的文件，并统计到失败队列
                if (md5 != item.md5) {
                  obj.unCached.push(item);
                  fs.unlinkSync(item.filePathName);
                  resolve();
                } else {
                  obj.cached.push(item);
                  resolve();
                }
              });
            } else {
              obj.unCached.push(item);
              resolve();
            }
          });
        });
      },
      0
    ).then(() => obj);
  }

  downloadWithConcurrency(unCached, concurrency = 3) {
    return new Promise((resolve, reject) => {
      try {
        startFS.mkdirSync(this._dir, 0o755);
      } catch (e) {
        reject(e);
      }

      const result = {
        success: [],
        fail: []
      };
      // debug('unCached : %o', unCached);
      if (unCached.length === 0) {
        const errorMsg = '没有需要下载的文件';
        this.emit(DownloadManager.ERROR, errorMsg);
        reject(errorMsg);
      } else {
        let count = 0;
        Promise.map(
          unCached,
          async (item, i) => {
            await this.downloadOneFile(item.file, item.filePathName)
              .then(() => {
                result.success.push(item);
                this.emit(DownloadManager.PROGRESS, {
                  result: true,
                  currentObj: item,
                  currentIndex: count++,
                  arrayIndex: i
                });
              })
              .catch(err => {
                unCached[i].err = err;
                result.fail.push(unCached[i]);
                this.emit(DownloadManager.PROGRESS, {
                  result: false,
                  currentObj: item,
                  currentIndex: count++,
                  arrayIndex: i,
                  err
                });

                // 17/01/2018 - TAG: by yanzhi.mo - 失败的歌曲直接删除，这里做下代码重构。
                fs.access(item.filePathName, error => {
                  if (!error) {
                    fs.unlinkSync(item.filePathName);
                  } else {
                    debug('fs.access error : %o', error);
                  }
                });
              });
          },
          { concurrency }
        );
      } // else

      this.on(DownloadManager.PROGRESS, res => {
        if (res.currentIndex === unCached.length - 1) {
          resolve(result);
        }
      });
    });
  }

  // 下载没有缓存的文件
  // const result = {success: [], fail: []};
  downloadSeries(unCached) {
    return new Promise((resolve, reject) => {
      try {
        startFS.mkdirSync(this._dir, 0o755);
      } catch (e) {
        reject(e);
      }

      const result = {
        success: [],
        fail: []
      };
      // debug('unCached : %o', unCached);
      if (unCached.length === 0) {
        const errorMsg = '没有需要下载的文件';
        this.emit(DownloadManager.ERROR, errorMsg);
        reject(errorMsg);
      } else {
        let count = 0;
        Promise.mapSeries(unCached, async (item, i) => {
          await this.downloadOneFile(item.file, item.filePathName)
            .then(() => {
              result.success.push(item);
              this.emit(DownloadManager.PROGRESS, {
                result: true,
                currentObj: item,
                currentIndex: count++,
                arrayIndex: i
              });
            })
            .catch(err => {
              unCached[i].err = err;
              result.fail.push(unCached[i]);
              this.emit(DownloadManager.PROGRESS, {
                result: false,
                currentObj: item,
                currentIndex: count++,
                arrayIndex: i,
                err
              });
            });
        });
        this.on(DownloadManager.PROGRESS, res => {
          if (res.currentIndex === unCached.length - 1) {
            resolve(result);
          }
        });
      } // else
    });
  }

  downloadOneFile(fileUrl, filePathName) {
    return new Promise((resolve, reject) => {
      let md5;
      let dmd5;
      const hash = crypto.createHash('md5');
      const ws = fs.createWriteStream(filePathName, { flag: 'w' });
      const d = download(fileUrl, {
        headers: {},
        useElectronNet: false // 哈哈，去掉就会崩溃，调了一下午
      });
      d.on('response', response => {
        md5 = response.headers['content-md5'];
      })
        .on('data', data => {
          hash.update(data, 'utf8');
        })
        .on('end', () => {
          dmd5 = hash.digest('base64');
          // debug('md5 = %o, dmd5 = %o', md5, dmd5);
        })
        .on('error', (err, body, response) => {
          reject(err, body, response);
        })
        .pipe(ws);

      d.catch(err => {
        // debug('d.catch : %o', err);
        reject(err);
      });

      ws.on('finish', () => {
        if (md5 === dmd5) {
          resolve(true);
        } else {
          reject(
            new Error(
              `md5 is not correct, md5 in response ${md5}, md5 for download file ${dmd5}`
            )
          );
        }
      }).on('error', err => {
        reject(err);
      });
    });
  }
}

DownloadManager.PROGRESS = 'DownloadManager:progress';
DownloadManager.ERROR = 'DownloadManager:error';
//
// , function (err, stat) {
//   if (stat && stat.isFile()) {
//     cached.push(playlist[i]);
//   } else {
//     unCached.push(playlist[i]);
//   }
// }
