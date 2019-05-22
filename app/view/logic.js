/* eslint-disable no-underscore-dangle,no-await-in-loop,no-restricted-syntax,class-methods-use-this */
import moment from 'moment';
import { message } from 'antd/lib/index';
import { getDailyPlan, getSTS } from '../api/index';
import nedb from '../utils/dbUtil';
import DownloadManager from '../download/downloadManager';
import MusicSchedule from '../core/musicSchedule';
import doJob from '../download/downloadJob';
import calcSignedUrl from '../api/signature';
import { cherryAll, extractTracks } from '../api/cache';

// const debug = require('debug')('startProcessManager');
const { history } = require('../store/configureStore');

export default class Logic {
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
      // @TODO: 检查当天是否有可以使用的预缓存，并替换最新
      if (activeCode) {
        if (playerPlan) {
          const res = await this._checkCache(playerPlan);
          await this._downloadCache(res);
        } else {
          const token = await getSTS();
          const dailyPlan = await getDailyPlan();
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

  async _checkCache(p) {
    this._updateUI(true, '正在检查本地歌曲缓存');
    const all = await cherryAll(p);
    return { site: p.site, setting: p.setting, ...all };
  }

  async _downloadCache(res) {
    this._updateUI(true, '正在下载缓存');

    const {
      setting,
      playlists: { cachedPlaylists, unCachedPlaylists },
      scrollAudioMessage: {
        cachedScrollAudioMessage,
        unCachedScrollAudioMessage
      },
      alarmAudioMessages: {
        cachedAlarmAudioMessages,
        unCachedAlarmAudioMessages
      }
    } = res;

    // 语音类优先下载，否则容易招致错误！！
    if (
      unCachedScrollAudioMessage.length > 0 ||
      unCachedAlarmAudioMessages.length > 0
    ) {
      const dm = new DownloadManager();
      await dm.downloadSeries([
        ...unCachedScrollAudioMessage,
        ...unCachedAlarmAudioMessages
      ]);
      console.info('完成语音类别的track下载');
      await this.run();
      return;
    }
    // 参数应该从props中拿到
    this._end();
    this._musicSchedule = new MusicSchedule(
      cachedPlaylists,
      cachedAlarmAudioMessages,
      cachedScrollAudioMessage,
      setting
    );
    this._updateUI(false, '初始化完成');
    this._updateCfg(setting.playerVolumn);

    const currentPlaylist = this._musicSchedule._playlistManager.findCanPlayList();
    if (!currentPlaylist) {
      setTimeout(this.run.bind(this), 5000);
    }

    if (currentPlaylist.length === 0) {
      const firstPatchSongs = unCachedPlaylists.map(pl => pl.tracks[0]);
      console.info('第一批歌曲 ', firstPatchSongs);
      const dm = new DownloadManager();
      await dm.downloadSeries(firstPatchSongs);
      await this.run();
    } else {
      const unCachedTracks = extractTracks(unCachedPlaylists);
      if (unCachedTracks.length > 0) {
        console.info('缓存有缺失，去下载');
        this._execDownload();
      } else {
        console.info('啥事儿都不做...');
      }
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
    if (this._timerKey !== null) {
      clearInterval(this._timerKey);
      this._timerKey = null;
    }

    this._musicSchedule.start(3000);
    this._timerKey = setInterval(() => {
      if (this._musicSchedule._playlistManager.playing()) {
        const currMusic = this._musicSchedule._playlistManager.findCanPlayMusic();
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
