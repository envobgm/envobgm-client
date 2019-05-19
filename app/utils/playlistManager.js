/* eslint-disable no-underscore-dangle,no-plusplus,no-return-assign,eqeqeq,no-restricted-syntax,no-param-reassign,class-methods-use-this,func-names */
import { Howl } from 'howler';
import Debug from 'debug';
import moment from 'moment';
import message from 'antd/lib/message';
import MusicManager from './musicManager';

const debug = Debug('PlaylistManager');

class PlaylistManager extends MusicManager {
  constructor(plan, setting) {
    // 默认选择第一个作为播放列表
    super(plan[0].tracks);
    this._setting = setting;
    this._plan = plan;
    this._playlistId = null;
    this._currentIndex = null;
    this._currentPlName = null;
    this._currentMusic = null;
    this._playlist = null;
    this._uuid = null;
    this._randoms = []; // 队列结构，存放歌曲下标，完成随机播放，且一轮内不重复

    // 是否为最后一首歌（针对播放列表切换的问题，不能直接把当前歌曲停止。）
    this._finalMusic = false;
    this._isPause = false;
  }

  getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
  }

  get currentIndex() {
    return this._currentIndex;
  }

  get currentPlName() {
    return this._currentPlName;
  }

  set currentIndex(index) {
    this._currentIndex = index;
  }

  _resetState() {
    this._playlistId = null;
    this._currentIndex = null;
    this._currentPlName = null;
  }

  _canSwitch(id) {
    // 对于这两个判断条件的解释：
    // 1、刚好在两个播放列表切换的时间点上
    // 2、由于在切换时发现旧的播放列表还有最后一首歌曲没播完，实际还没发生切换，要等最后一首歌end之后才能切换
    if (this._playlistId !== id || this._finalMusic) {
      return true;
    }
    return false;
  }

  _switch(newPl) {
    const m = this._playlist ? this._playlist[this._currentIndex] : null;
    if (m && m.howl && m.howl.playing()) {
      if (!this._finalMusic) this._finalMusic = true;
      return this._playlist;
    }
    debug('当前播放的时段: %s~%s', newPl.startTm, newPl.endTm);
    this._playlistId = newPl.uuid;
    this._uuid = newPl.uuid;
    this.stop(); // 停止旧播放列表的播放
    this._playlist = newPl.tracks; // 用新的播放列表替换，并重置索引，避免访问越界。
    this._currentIndex = this.getRandomInt(0, newPl.tracks.length);
    this._currentPlName = newPl.name;
    return newPl.tracks;
  }

  updatePlaylist(finishedSong) {
    // todo 后期优化一下，匹配并加入列表之后，直接退出循环
    try {
      this._plan.forEach(pl => {
        // 更新正在使用的播放列表
        if (finishedSong.plUuid == this._uuid) {
          this.getCurrentPlaylist().push(finishedSong);
          return;
        }
        // 更新未使用的播放列表
        if (
          finishedSong.plUuid == pl.uuid &&
          finishedSong.plUuid != this._uuid
        ) {
          pl.tracks.push(finishedSong);
        }
      });
    } catch (e) {
      message.error(e);
    }
  }

  /**
   * 算法：
   * 1、查询当前时间有没有符合播放条件的播放列表。
   * 这里有三种情况：
   * a）存在符合条件的播放列表，并且是由一个旧的播放列表过渡到新的播放列表（意思就
   *    是上个播放列表和检测出的新的播放列表不一样），所以需要切换播放列表。
   * b）存在符合条件的播放列表，但是旧的播放列表和新的播放列表属于同一个，因此直接返回旧的即可。
   * c）不存在符合条件的播放列表，进入逻辑 2，随机设置播放列表。
   *
   * 2、随机设置一个播放列表（这里也存在新旧播放列表的切换问题，可以参考 1 中的 a)、b））。
   *
   * @returns
   * @memberof PlaylistManager
   */
  getCurrentPlaylist() {
    let start = null;
    let end = null;
    let now = null;
    for (const playlist of this._plan) {
      start = moment(playlist.startTm, 'HH:mm:ss');
      end = moment(playlist.endTm, 'HH:mm:ss');
      now = moment();
      if (start.isBefore(now) && end.isAfter(now)) {
        if (this._canSwitch(playlist.uuid)) {
          // 判断是否是新旧播放列表的交替
          return this._switch(playlist);
        }
        return this._playlist;
      }
    }

    this._resetState();
    return (this._playlist = null);
  }

  getCurrentMusic() {
    const currPlaylist = this.getCurrentPlaylist();
    if (!currPlaylist) return this._currentMusic || null;
    // 单例模式
    // MD5区分歌曲是否更新，这里MD5作为唯一标志
    this._currentMusic = (function(currentMusic, music) {
      if (currentMusic && currentMusic.md5 === music.md5) {
        return currentMusic;
      }
      return music;
    })(this._currentMusic, { ...currPlaylist[this._currentIndex] });
    if (this._currentMusic && !this._currentMusic.howl) {
      this._currentMusic.howl = new Howl({
        src: [this._currentMusic.filePathName],
        autoplay: false,
        onload: this._onLoad.bind(this),
        onplay: this._onPlay.bind(this),
        onend: this._onEnd.bind(this),
        onpause: this._onPause.bind(this),
        onstop: this._onStop.bind(this)
      });
      debug('创建howl实例：', this._currentMusic.howl);
    }
    return this._currentMusic;
  }

  _onLoad() {
    super._onLoad();
    debug(`play ${this.getCurrentMusic().title}`);
  }

  _onPlay() {
    super._onPlay();
    debug(`play ${this.getCurrentMusic().title}`);
  }

  _onPause() {
    super._onPause();
    debug(`pause ${this.getCurrentMusic().title}`);
  }

  _onStop() {
    super._onStop();
    this._currentMusic.howl = null;
    debug(`_onStop ${this.getCurrentMusic().title}`);
  }

  _onEnd() {
    super._onEnd();
    this._currentMusic.howl = null;
    if (this._finalMusic) this._finalMusic = false;
    if (!this._playlist) {
      this._resetState();
      return;
    }
    this._currentIndex++;
    this._currentIndex %= this._playlist.length;
    debug(
      `end ${this.getCurrentMusic().title}，next index++: ${this._currentIndex}`
    );
  }

  play() {
    const music = this.getCurrentMusic();
    if (!this._isLoading && music && music.howl && !music.howl.playing()) {
      this._isLoading = true;
      const id = music.howl.play();
      debug('开始播放：', music.howl);
      music.howl.fade(0, 1, this._setting.fadeInTm, id);
    }
    this._isPause = false;
  }

  playing() {
    const music = this.getCurrentMusic();
    return this._isLoading || (music && music.howl && music.howl.playing());
  }

  pause() {
    const music = this.getCurrentMusic();
    if (music && music.howl && music.howl.playing()) {
      music.howl.pause();
    }
    this._isPause = true;
  }

  stop() {
    const music = this.getCurrentMusic();
    if (music && music.howl && music.howl.playing()) {
      music.howl.stop();
      // 下次随机播放不同的音乐
      if (!this._playlist) {
        this._resetState();
        return;
      }
      if (this._randoms.length === 0) {
        console.debug('随机队列一轮播放结束');
        this._randoms = Object.keys(this._playlist);
      }
      this._currentIndex = this._randoms.splice(
        this.getRandomInt(0, this._randoms.length),
        1
      );
      console.debug(
        '歌曲放完了，准备随机放下一首歌曲 ',
        this._playlist[this._currentIndex]
      );
    }
  }

  pausing() {
    return this._isPause;
  }
}

export default PlaylistManager;
