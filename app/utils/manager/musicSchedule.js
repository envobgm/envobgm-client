/* eslint-disable no-underscore-dangle,global-require,no-plusplus */
/**
 * Created by shenyin.sy on 17/8/14.
 */

import moment from 'moment';
import Debug from 'debug';
import EventEmitter from 'events';
import MusicManager from './musicManager';
import AlarmAudioManager from './alarmAudioManager';
import ScrollAudioManager from './scrollAudioManager';
// import PlaylistManager from './playlistManager';
import playlistManagerProxy from './playlistManagerProxy';

const debug = Debug('MusicSchedule');

class MusicSchedule extends EventEmitter {
  constructor(playlists, alarmAudioMessages, scrollAudioMessage, setting) {
    super();
    this._playlistManager = playlistManagerProxy(playlists, setting);
    this._alarmAudioManager = new AlarmAudioManager(alarmAudioMessages);
    this._scrollAudioManager = new ScrollAudioManager(scrollAudioMessage);
    this._setting = setting;
    this._interval = null;
    this._index = 0;
    this._showError = true;

    this._scrollAudioManager.on(MusicManager.END, () => {
      // 重置，防止溢出
      this._index = 0;
      debug(
        `on _scrollAudioManager ${MusicManager.END}, reset index to ${
          this._index
        }`
      );
    });

    this._playlistManager.on(MusicManager.END, () => {
      this._index++;
      debug(
        `on _playlistManager ${MusicManager.END} 2，index is ${this._index}`
      );
    });

    this._alarmAudioManager.on(MusicManager.END, () => {
      this._index++;
      debug(
        `on _alarmAudioManager ${MusicManager.END}, index is ${this._index}`
      );
    });
  }

  get playlistManager() {
    return this._playlistManager;
  }

  get alarmAudioManager() {
    return this._alarmAudioManager;
  }

  get scrollAudioManager() {
    return this._scrollAudioManager;
  }

  _InWorkTime() {
    let ret;
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.envoplayer === 'debug'
    ) {
      ret = true;
    } else {
      const start = moment(this._setting.playerStartTm, 'HH:mm:ss');
      const end = moment(this._setting.playerEndTm, 'HH:mm:ss');
      const now = moment();
      ret = start.isBefore(now) && end.isAfter(now);
    }
    if (!ret && this._showError) {
      this._showError = false;
      const { dialog } = require('electron').remote;
      dialog.showErrorBox('工作时间', '现在已经不在工作时间了，音乐不会播放');
    }
    return ret;
  }

  // 算法3，播放结束事件不处理, 只用循环
  // 1. 进入轮询
  // 2. 检测语音播报，有就触发，简化，有插播正在播也不触发
  // 3. 如果没有语音播报，和正常播放，检测插播语音，达到条件则触发
  // 4. 如果没有语音播报和插播，播放正常列表语音，可以自动跳到下一首，前面语音播报中断的也可以继续播放
  // 5. 语音播报和正常歌曲结束增加插播语音index
  // 6. 插播语音结束重置index

  // 下面的算法采取了算法3的简化版本
  _run() {
    if (this._InWorkTime()) {
      // 保证播报最先放
      // 开始播放语音播报， 可能打断_playlistManager的播放
      // 如果插播语音正在播放，则不处理，简化
      if (
        this._scrollAudioManager.complete() &&
        this._alarmAudioManager.findCanPlayMusic()
      ) {
        if (!this._alarmAudioManager.playing()) {
          debug('强制暂停当前播放的音乐，开始播放插播语音');
          this._playlistManager.forcePausing(true);
          this._playlistManager.pause();
          this._alarmAudioManager.play();
        }
        return;
      }

      if (
        this._alarmAudioManager.complete() &&
        this._playlistManager.complete() &&
        this._scrollAudioManager.findCanPlayMusic(this._index)
      ) {
        if (!this._scrollAudioManager.playing()) {
          debug('满足轮询次数，开始播放轮播语音');
          this._scrollAudioManager.play();
        }
        return;
      }

      // 开始播放播放列表中的歌曲
      if (
        this._playlistManager.forcePauseState &&
        this._alarmAudioManager.complete() &&
        this._scrollAudioManager.complete()
      ) {
        // 被强制暂停的状态
        debug('由于被插播强制暂停，现在恢复音乐播放');
        this._playlistManager.forcePausing(false);
        this._playlistManager.play();
      }
      if (
        this._alarmAudioManager.complete() &&
        this._scrollAudioManager.complete() &&
        this._playlistManager.complete()
      ) {
        debug('音乐播放结束了，开始下一首');
        this._playlistManager.play();
      }
    } else {
      debug(
        '.......!!!!!!!!!!!!!!!not _InWorkTime. return!!!!!!!!!!!!!!!!!......'
      );
      this.end();
    }
  }

  start(i) {
    if (this._interval !== null) {
      clearInterval(this._interval);
      this._interval = null;
    }

    debug('start setInterval');
    const interval = i >= 100 && i <= 2000 ? i : 1000;
    this._interval = setInterval(this._run.bind(this), interval);
  }

  end() {
    debug('clearInterval');
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
      this._playlistManager.stop();
      this._scrollAudioManager.stop();
      this._alarmAudioManager.stop();
    }
  }
}

export default MusicSchedule;
