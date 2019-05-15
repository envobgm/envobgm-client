/* eslint-disable no-underscore-dangle,no-undef */
import Debug from 'debug';
import { Howl } from 'howler';
import MusicManager from './musicManager';

const debug = Debug('ScrollAudioManager');

class ScrollAudioManager extends MusicManager {
  constructor(music) {
    debug('ScrollAudioManager : O%', music);
    super(music);
    const { frequency } = music[0];
    this._frequency = frequency > 1 ? frequency : 2;
    this._currentMusic = null;
  }

  findCanPlayMusic(currentIndex) {
    if (currentIndex % this._frequency === 0 && currentIndex !== 0) {
      const music = this._playlist[0];
      if (!music.howl) {
        debug('localFilePath : %o', music.filePathName);
        music.howl = new Howl({
          src: [music.filePathName],
          onplay: this._onPlay.bind(this),
          onend: this._onEnd.bind(this),
          onpause: this._onPause.bind(this),
          onstop: this._onStop.bind(this)
        });
      }
      this._currentMusic = music;
      return music;
    }
    return null;
  }

  _onPlay() {
    super._onPlay();
    debug(`play ${this._currentMusic.title}`);
  }

  _onPause() {
    super._onPause();
    debug(`pause ${this._currentMusic.title}`);
  }

  _onEnd() {
    super._onEnd();
    this._currentMusic.howl = null;
    debug(`end ${this._currentMusic.title}`);
  }

  _onStop() {
    super._onStop();
    this._currentMusic.howl = null;
    debug(`stop ${this._currentMusic.title}`);
  }

  play() {
    if (!this._currentMusic) {
      this._currentMusic = this.findCanPlayMusic();
    }
    const music = this._currentMusic;
    if (!this._isLoading && music && !music.howl.playing()) {
      this._isLoading = true;
      music.howl.play();
    }
  }

  playing() {
    return (
      this._isLoading ||
      (this._currentMusic &&
        this._currentMusic.howl &&
        this._currentMusic.howl.playing())
    );
  }

  pause() {
    const music = this._currentMusic;
    if (music && music.howl && !music.howl.playing()) {
      music.howl.pause();
    }
  }

  stop() {
    const music = this._currentMusic;
    if (music && music.howl && !music.howl.playing()) {
      music.howl.stop();
    }
  }
}

export default ScrollAudioManager;
