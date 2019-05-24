/* eslint-disable no-underscore-dangle,no-await-in-loop,no-restricted-syntax,class-methods-use-this */
import moment from 'moment';
import { message } from 'antd/lib/index';
import { getDailyPlan, getSTS } from '../api/index';
import nedb from '../utils/dbUtil';
import DownloadManager from '../download/downloadManager';
import MusicSchedule from './musicSchedule';
import doJob from '../download/downloadJob';
import calcSignedUrl from '../api/signature';
import { cherryAll, extractTracks } from '../api/cache';
import { invokeClearTask } from '../task/clearCacheTask';

const dm = new DownloadManager();
const debug = require('debug')('startProcessManager');
const { history } = require('../store/configureStore');

/**
 * @TODO: UI更新这块后面选择用进程通讯的方式来做
 */
export default class LaunchManager {
  constructor(options) {
    this._updateUI = options.updateUI;
    this._updateCfg = options.updateCfg;
    this._updateInfo = options.updateInfo;
    this._musicSchedule = null;
    this._interval = null; // 计时器索引

    // 启动定时清除缓存计划
    invokeClearTask();
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

    /**
     *  1.优先下载语音信息
     *  2.如检测到歌曲下载为0，则先下载部分歌曲，优先提供播放
     *  3.下载剩余歌曲
     */
    // 语音下载
    if (
      unCachedScrollAudioMessage.length > 0 ||
      unCachedAlarmAudioMessages.length > 0
    ) {
      this._updateUI(true, '正在下载语音');
      debug('需要下载的语音缓存：', [
        ...unCachedScrollAudioMessage,
        ...unCachedAlarmAudioMessages
      ]);
      await dm.downloadSeries([
        ...unCachedScrollAudioMessage,
        ...unCachedAlarmAudioMessages
      ]);
      this._updateUI(false, '下载语音成功');
      await this.run();
      return;
    }

    // 缓存优先播放的音乐
    const cachedPlaylistsTracks = cachedPlaylists.reduce((a, b) => {
      if (b.tracks[0]) a.push(b.tracks[0]);
      return a;
    }, []);
    if (cachedPlaylistsTracks.length === 0) {
      const firstPatchSongs = unCachedPlaylists.map(pl => pl.tracks[0]);
      debug('需要下载的优先播放缓存', firstPatchSongs);
      this._updateUI(true, '优先缓存部分歌曲');
      await dm.downloadSeries(firstPatchSongs);
      this._updateUI(false, '缓存成功');
      await this.run();
      return;
    }

    // 下载剩余音乐
    const unCachedTracks = extractTracks(unCachedPlaylists);
    if (unCachedTracks.length > 0) {
      debug('需要下载的剩余缓存', unCachedPlaylists);
      this._execDownload();
    }

    // 初始化musicSchedule
    this._end();
    this._musicSchedule = new MusicSchedule(
      cachedPlaylists,
      cachedAlarmAudioMessages,
      cachedScrollAudioMessage,
      setting
    );
    this._updateUI(false, '缓存成功');
    this._updateCfg(setting.playerVolumn);
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
    if (this._musicSchedule) {
      if (this._interval !== null) {
        clearInterval(this._interval);
        this._interval = null;
      }

      this._musicSchedule.start(3000);
      this._interval = setInterval(() => {
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
  }

  _end() {
    if (this._musicSchedule) {
      this._musicSchedule.end();
      clearInterval(this._interval || 0);
      this._interval = null;
    }
  }
}
