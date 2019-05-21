/* eslint-disable no-unused-expressions,no-shadow,no-plusplus */
import Debug from 'debug';
import DownloadManager from './downloadManager';
import nedb from '../db';
import { updateDailyPlan } from '../../api/index';

const debug = Debug('downloadJob');

export default function doJob(date, callback) {
  let count = 0;

  async function job() {
    const unCached = await updateDailyPlan(date);
    // todo 操，调试了一晚上，发现重试机制导致了callback && callback(100, true);这段代码调了N次
    if (unCached && unCached.length > 0) {
      const downloadManager = new DownloadManager();
      downloadManager.on(DownloadManager.PROGRESS, value => {
        if (value.result) {
          callback &&
            callback(
              Math.round((++count / unCached.length) * 100),
              false,
              value.currentObj
            );
        }
      });

      // 下载进度条 & 重试限制
      // 1、增加进度条，但是要考虑下载有自动重试的功能，怎么在进度上反馈。
      // 2、直接把debug打印显示在页面上或者保存在一个日志文件，这样也是一种进度，但是对用户不友好，不过对开发调试友好，可以方便查找问题，这一块也可以考虑
      // 3、可以增加重试次数防止一直做无用功。
      await downloadManager.downloadSeries(unCached);
    }
    callback && callback(100, true);
  }

  // 判断是否激活
  nedb().find(
    {
      $where() {
        return Object.keys(this).indexOf('activeCode') !== -1;
      }
    },
    async (err, docs) => {
      if (docs[0] && docs[0].activeCode) {
        try {
          await job();
        } catch (err) {
          debug('%O', err);
        }
      }
    }
  );
}
