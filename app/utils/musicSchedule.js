/* eslint-disable no-underscore-dangle,global-require,no-plusplus */
/**
 * Created by shenyin.sy on 17/8/14.
 */

import moment from 'moment';
import Debug from 'debug';
import EventEmitter from 'events';
import MusicManager from './musicManager';
import AlarmAudioManager from './alarmAudioManager';
import PlaylistManager from './playlistManager';
import ScrollAudioManager from './scrollAudioManager';

const debug = Debug('MusicSchedule');

class MusicSchedule extends EventEmitter {
  constructor(playlists, alarmAudioMessages, scrollAudioMessage, setting) {
    super();
    this._playlistManager = new PlaylistManager(playlists, setting);
    this._alarmAudioManager = new AlarmAudioManager(alarmAudioMessages);
    this._scrollAudioManager = new ScrollAudioManager(scrollAudioMessage);
    this._setting = setting;
    this._timeId = null;
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
        !this._scrollAudioManager.playing() &&
        this._alarmAudioManager.findCanPlayMusic()
      ) {
        this._playlistManager.pause();
        this._alarmAudioManager.play();
        return;
      }

      if (
        !this._alarmAudioManager.playing() &&
        !this._playlistManager.playing() &&
        this._playlistManager.complete() &&
        this._scrollAudioManager.findCanPlayMusic(this._index)
      ) {
        this._scrollAudioManager.play();
        return;
      }

      // 开始播放播放列表中的歌曲
      if (
        !this._scrollAudioManager.playing() &&
        !this._alarmAudioManager.playing() &&
        (this._playlistManager.complete() || !this._playlistManager.pausing())
      ) {
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
    debug('start setInterval');
    const interval = i >= 100 && i <= 2000 ? i : 1000;
    this._timeId = setInterval(this._run.bind(this), interval);
  }

  end() {
    debug('clearInterval');
    if (this._timeId) {
      clearInterval(this._timeId);
      this._playlistManager.stop();
      this._scrollAudioManager.stop();
      this._alarmAudioManager.stop();
    }
  }
}

export default MusicSchedule;
