/* eslint-disable no-underscore-dangle,no-await-in-loop,no-restricted-syntax,class-methods-use-this */
import moment from 'moment';
import { message } from 'antd/lib/index';
import fs from 'fs';
import {
  calcSignedUrl,
  getMacAddr,
  getPlayList,
  requestDownloadAK
} from '../api';
import nedb from './db';
import DownloadManager from './downloadManager';
import MusicSchedule from './musicSchedule';
import doJob from '../download/downloadJob';

// const debug = require('debug')('startProcessManager');
const path = require('path');
const os = require('os');
const Datastore = require('nedb');
const { history } = require('../store/configureStore');

export default class StartProcessManager {
  constructor(options) {
    this._updateUI = options.updateUI;
    this._updateCfg = options.updateCfg;
    this._updateInfo = options.updateInfo;
    this._musicSchedule = null;
    this._timerKey = null; // 计时器索引
  }

  get musicSchedule() {
    return this._musicSchedule;
  }

  async run() {
    if (nedb.checkDBPath()) {
      const activeCode = await nedb.getActiveCode();
      const playerPlan = await nedb.getPlayerPlan();
      // todo playerPlan = this._checkPlan(playerPlan);
      if (activeCode) {
        if (playerPlan) {
          const res = await this._checkCache(playerPlan);
          await this._downloadCache(res);
        } else {
          const mac = await getMacAddr();
          const token = await requestDownloadAK(mac);
          const dailyPlan = await getPlayList(mac).then(
            res => res.content.dailyPlan
          );
          if (!dailyPlan || !token) {
            throw new Error('获取token或者播放列表失败！');
          }
          const ret = calcSignedUrl(dailyPlan, token);
          await nedb.insert({ playerPlan: ret });
          const res = await this._checkCache(ret);
          await this._downloadCache(res);
        }
        return;
      }
    }
    history.push('/active');
  }

  async _checkPlan() {
    const newPlanPath = path.join(
      os.homedir(),
      '.bgm',
      `${moment().format('YYYY-MM-DD')}.db`
    );
    if (fs.existsSync(newPlanPath)) {
      console.debug('发现新的播放计划');
      const activeCode = await nedb.getActiveCode();
      const planPath = nedb.dbPath;
      // 删除旧缓存
      fs.unlinkSync(planPath);
      // 存储激活码
      const db = new Datastore({ filename: newPlanPath, autoload: true });
      db.insert({ activeCode });
      // 重建缓存，新的播放计划替代旧的计划
      fs.renameSync(newPlanPath, planPath);
    }
  }

  async _checkCache(p) {
    this._updateUI(true, '正在检查本地歌曲缓存');
    const {
      playlists,
      scrollAudioMessage,
      alarmAudioMessages,
      setting,
      site
    } = p;
    const dm = new DownloadManager();
    const cPlaylists = [];
    for (const playlist of playlists) {
      cPlaylists.push({
        ...playlist,
        tracks: await dm.checkCache(playlist.tracks)
      });
    }
    const cScrollAudioMessage = await dm.checkCache([scrollAudioMessage]);
    const cAlarmAudioMessages = await dm.checkCache(alarmAudioMessages);
    return {
      cPlaylists,
      cScrollAudioMessage,
      cAlarmAudioMessages,
      setting,
      site
    };
  }

  async _downloadCache(res) {
    this._updateUI(true, '正在下载缓存');
    const playlists = res.cPlaylists.map((cpl, id) => ({
      ...cpl,
      id,
      tracks: cpl.tracks.cached
    }));
    const alarmAudioMessages = res.cAlarmAudioMessages.cached;
    const scrollAudioMessage = res.cScrollAudioMessage.cached;
    // 语音类优先下载，否则容易招致错误！！
    if (
      res.cAlarmAudioMessages.unCached.length > 0 ||
      res.cScrollAudioMessage.unCached.length > 0
    ) {
      const dm = new DownloadManager();
      await dm.downloadSeries([
        ...res.cAlarmAudioMessages.unCached,
        ...res.cScrollAudioMessage.unCached
      ]);
      console.info('完成语音类别的track下载');
      await this.run();
      return;
    }
    const { setting } = res;
    // 参数应该从props中拿到
    this._end();
    this._musicSchedule = new MusicSchedule(
      playlists,
      alarmAudioMessages,
      scrollAudioMessage,
      setting
    );
    this._updateUI(false, '初始化完成');
    this._updateCfg(setting.playerVolumn);
    if (
      this._musicSchedule._playlistManager.getCurrentPlaylist().length === 0
    ) {
      const firstPatchSongs = res.cPlaylists.map(pl => pl.tracks.unCached[0]);
      console.info('第一批歌曲 ', firstPatchSongs);
      const dm = new DownloadManager();
      await dm.downloadSeries(firstPatchSongs);
      await this.run();
    } else {
      const unCachedTracks = res.cPlaylists.reduce(
        (a, b) => a.concat(b.tracks.unCached),
        []
      );
      if (unCachedTracks.length > 0) {
        console.info('缓存有缺失，去下载');
        this._execDownload();
        return;
      }
      console.info('啥事儿都不做...');
    }
    this._start();
  }

  _execDownload() {
    if (!nedb.checkDBPath()) {
      this._end();
      history.push('/active');
      return;
    }
    if (navigator.onLine) {
      try {
        this._updateUI(true, '正在更新');
        doJob(moment(), async (percent, done, finishedItem) => {
          if (done) {
            this._updateUI(false, '更新完成');
            await this.run();
          } else {
            // 边下边播，成功缓存一首歌曲则加入播放列表
            this._musicSchedule._playlistManager.updatePlaylist(finishedItem);
            this._updateUI(true, `更新进度${percent}%`);
          }
        });
      } catch (e) {
        message.error(e);
      }
    } else {
      this._updateUI(false, '未连接网络，请检查或重新操作');
    }
  }

  _start() {
    this._musicSchedule.start(3000);
    this._timerKey = setInterval(() => {
      if (this._musicSchedule._playlistManager.playing()) {
        const currMusic = this._musicSchedule._playlistManager.getCurrentMusic();
        const currSeek = currMusic.howl.seek();
        const currDuration = currMusic.howl.duration();
        this._updateInfo(
          currSeek,
          (currSeek / currDuration) * 100,
          currDuration
        );
      }
    }, 500);
  }

  _end() {
    if (this._musicSchedule) {
      this._musicSchedule.end();
      clearInterval(this._timerKey || 0);
      this._timerKey = null;
    }
  }
}
