/* eslint-disable no-underscore-dangle,no-plusplus,no-return-assign,eqeqeq,no-restricted-syntax,no-param-reassign,class-methods-use-this,func-names */
import message from 'antd/lib/message';
import MusicManager from './musicManager';
import MusicFactory from './pattern/factory/musicFactory';

const debug = require('debug')('playlistManager');

const musicFactory = new MusicFactory();

class PlaylistManager extends MusicManager {
  constructor(plan, setting) {
    // 默认选择第一个作为播放列表
    super(plan[0].tracks);
    this._setting = setting;
    this._plan = plan;
    this._currentIndex = null;
    this._currentMusic = null;
    this._playlist = null;
    this._uuid = null;

    // 是否为最后一首歌（针对播放列表切换的问题，不能直接把当前歌曲停止。）
    this._finalMusic = false;
  }

  get currentIndex() {
    return this._currentIndex;
  }

  set currentIndex(index) {
    this._currentIndex = index;
  }

  /**
   * 更新播放列表
   * @param newSong
   */
  updatePlaylist(newSong) {
    try {
      this._plan.every(pl => {
        if (newSong.plUuid == pl.uuid) {
          debug('加入新歌：', pl.name, pl.tracks);
          pl.tracks.push(newSong);
          return false;
        }
        return true;
      });
    } catch (e) {
      message.error(e);
    }
  }

  // @交由代理实现方法逻辑
  findCanPlayList() {}

  findCanPlayMusic() {
    // @前置逻辑交由代理实现，目标方法只管返回歌曲对象
    if (this._currentMusic && !this._currentMusic.howl) {
      this._currentMusic.howl = musicFactory.createHowl({
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
    debug(`play ${this.findCanPlayMusic().title}`);
  }

  _onPlay() {
    super._onPlay();
    debug(`play ${this.findCanPlayMusic().title}`);
  }

  _onPause() {
    super._onPause();
    debug(`pause ${this.findCanPlayMusic().title}`);
  }

  _onStop() {
    super._onStop();
    debug(`_onStop ${this.findCanPlayMusic().title}`);
  }

  _onEnd() {
    super._onEnd();
    debug(`_onEnd ${this.findCanPlayMusic().title}`);
  }

  play() {
    const music = this.findCanPlayMusic();
    if (!this._isLoading && music && music.howl && !music.howl.playing()) {
      this._isLoading = true;
      const id = music.howl.play();
      debug('开始播放：', music.howl);
      music.howl.fade(0, 1, this._setting.fadeInTm, id);
    }
  }

  playing() {
    const music = this.findCanPlayMusic();
    return this._isLoading || (music && music.howl && music.howl.playing());
  }

  pause() {
    const music = this.findCanPlayMusic();
    if (music && music.howl && music.howl.playing()) {
      music.howl.pause();
    }
  }

  stop() {
    const music = this.findCanPlayMusic();
    if (music && music.howl && music.howl.playing()) {
      music.howl.stop();
    }
  }
}

export default PlaylistManager;
