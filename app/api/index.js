/* eslint-disable no-underscore-dangle,no-unused-vars,no-await-in-loop,no-restricted-syntax,eqeqeq */
import Debug from 'debug';
import moment from 'moment';
import os from 'os';
import path from 'path';
import fs from 'fs';

import DownloadManager from '../utils/downloadManager';
import nedb from '../utils/db';
import OssClient from '../utils/ossClient';

const dbPath = path.join(os.homedir(), '.bgm', 'player.db');
const debug = new Debug('api');
const getMacAddr = require('../utils/cust').macAddr;
const { history } = require('../store/configureStore');

let baseUrl;
if (process.env.NODE_ENV === 'production') {
  baseUrl = '47.100.161.213:10080'; // 生产
}
if (process.env.NODE_ENV === 'development') {
  baseUrl = '47.100.161.213:10080'; // 测试
}
debug(`服务地址:${baseUrl}`);

const active = async activationKey => {
  const mac = await getMacAddr();
  const url = `http://${baseUrl}/siteapi/${mac}/active/${activationKey}`;
  const res = await fetch(url, { method: 'put' }).then(response =>
    response.json()
  );
  if (res.hasError) {
    throw res;
  }
  return res;
};

const getPlayList = async (mac, pDate = null) => {
  let date;
  if (pDate) {
    date = moment(pDate).format('YYYY-MM-DD');
  } else {
    date = moment().format('YYYY-MM-DD');
  }
  const url = `http://${baseUrl}/siteapi/${mac}/playerInfo?date=${date}`;
  const res = await fetch(url, { method: 'get' }).then(response =>
    response.json()
  );
  if (res.hasError) {
    throw res;
  }
  return res;
};

// 请求临时凭证
const requestDownloadAK = async mac => {
  const result = await fetch(
    `http://${baseUrl}/ossapi/requestDownloadAK/${mac}`,
    {
      method: 'post'
    }
  ).then(response => response.json());
  if (result.status == 400 && result.hasError) {
    await nedb.clear();
    history.replace('/active');
    return;
  }
  return result.content.token;
};

//
// --------------------------------------------------
// 4. 通过STS计算出携带签名的URL
// --------------------------------------------------
//
const calcSignedUrl = (dailyPlan, token) => {
  const client = new OssClient(token);
  debug('dailyPlan: %O', dailyPlan);
  const playlists = dailyPlan.playlists.map((playlist, index) => {
    return {
      ...playlist,
      uuid: index,
      tracks: playlist.tracks.map(media => ({
        plUuid: index,
        title: media.name,
        md5: media.etag,
        file: client._signatureUrl(media.ossPath),
        howl: null
      }))
    };
  });

  // 轮播语音
  let oss = dailyPlan.scrollAudioMessage.ossPath;
  const scrollAudioMessage = {
    frequency: dailyPlan.scrollAudioMessage.frequency,
    title:
      dailyPlan.scrollAudioMessage.name ||
      oss.substring(oss.lastIndexOf('/') + 1),
    md5: dailyPlan.scrollAudioMessage.etag,
    file: client._signatureUrl(dailyPlan.scrollAudioMessage.ossPath),
    howl: null
  };

  // 插播语音
  const alarmAudioMessages = dailyPlan.alarmAudioMessages.map(media => {
    oss = media.ossPath;
    return {
      alarmTm: media.alarmTm,
      title: media.name || oss.substring(oss.lastIndexOf('/') + 1),
      md5: media.etag,
      file: client._signatureUrl(media.ossPath),
      howl: null
    };
  });

  return {
    playlists,
    scrollAudioMessage,
    alarmAudioMessages,
    setting: dailyPlan.setting,
    site: dailyPlan.site
  };
};

const checkPlaylist = date =>
  new Promise(async (resolve, reject) => {
    const mac = await getMacAddr();
    const token = await requestDownloadAK(mac);
    const dailyPlan = await getPlayList(mac, date).then(
      res => res.content.dailyPlan
    );
    if (!dailyPlan || !token) {
      throw new Error('获取token或者播放列表失败！');
    }
    const {
      playlists,
      scrollAudioMessage,
      alarmAudioMessages,
      setting,
      site
    } = calcSignedUrl(dailyPlan, token);
    // 更新本地数据库
    nedb().find(
      {
        $where() {
          return Object.keys(this).indexOf('activeCode') !== -1;
        }
      },
      async (err, docs) => {
        const { activeCode } = docs[0];
        await fs.unlinkSync(dbPath);
        nedb().insert({ activeCode }, () => {
          nedb().insert(
            {
              playerPlan: {
                playlists,
                scrollAudioMessage,
                alarmAudioMessages,
                setting,
                site
              }
            },
            async () => {
              const dm = new DownloadManager();
              let unCachedPlaylist = [];
              let tracks = null;
              for (const playlist of playlists) {
                tracks = await dm.checkCache(playlist.tracks);
                unCachedPlaylist = [...unCachedPlaylist, ...tracks.unCached];
              }
              debug('unCachedPlaylist: %O', unCachedPlaylist);
              const unCachedScrollAudioMessage = await dm.checkCache([
                scrollAudioMessage
              ]);
              const unCachedAlarmAudioMessages = await dm.checkCache(
                alarmAudioMessages
              );
              resolve([
                ...unCachedPlaylist,
                ...unCachedScrollAudioMessage.unCached,
                ...unCachedAlarmAudioMessages.unCached
              ]);
            }
          );
        });
      }
    );
  });

export {
  active,
  getMacAddr,
  requestDownloadAK,
  getPlayList,
  calcSignedUrl,
  checkPlaylist
};
