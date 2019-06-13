import message from 'antd/lib/message';
import { Howl } from 'howler';
import MusicManager from './musicManager';

const debug = require('debug')('playlistManager');

class PlaylistManager extends MusicManager {
  constructor(plan, setting) {
    // 默认选择第一个作为播放列表
    super(plan[0].tracks);
    this._setting = setting;
    this._plan = plan;
    this._forcePauseState = false;
  }

  get forcePauseState() {
    return this._forcePauseState;
  }

  forcePause(state) {
    this._forcePauseState = state;
  }

  /**
   * 更新播放列表
   * @param newSong
   */
  updatePlaylist(newSong) {
    try {
      this._plan.every(pl => {
        if (newSong.plUuid === pl.uuid) {
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
  findCanPlayList() {
    return this._playlist;
  }

  // @交由代理实现方法逻辑
  findCanPlayMusic() {
    if (!this._music) {
      const [song] = this.findCanPlayList();
      this._music = song;
    }
    if (this._music && !this._music.howl) {
      this._music.howl = new Howl({
        src: [this._music.filePathName],
        autoplay: false,
        onload: this._onLoad.bind(this),
        onplay: this._onPlay.bind(this),
        onend: this._onEnd.bind(this),
        onpause: this._onPause.bind(this),
        onstop: this._onStop.bind(this)
      });
      debug('创建howl实例：', this._music.howl);
    }
    return this._music;
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
