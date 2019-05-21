/* eslint-disable no-underscore-dangle,class-methods-use-this,no-plusplus */
/**
 * Created by shenyin.sy on 17/8/17.
 */
import EventEmitter from 'events';

const debug = require('debug')('musicManager');

class MusicManager extends EventEmitter {
  constructor(playlist) {
    super();
    this._playlist = Array.isArray(playlist) ? playlist : [playlist];
    // howler event is late
    this._isLoading = false;
    this._isCompleted = true;

    this.setMaxListeners(10);
  }

  // 注意：所有howler事件都指向对象的方法，所以可以节省内存

  _onLoad() {
    debug(MusicManager.LOAD);
    this.emit(MusicManager.LOAD);
  }

  _onPlay() {
    this._isLoading = false;
    this._isCompleted = false;
    debug(MusicManager.PALY);
    this.emit(MusicManager.PALY);
  }

  _onEnd() {
    this._isCompleted = true;
    debug(MusicManager.END);
    this.emit(MusicManager.END);
  }

  _onPause() {
    debug(MusicManager.PAUSE);
    this.emit(MusicManager.PAUSE);
  }

  _onStop() {
    this._isCompleted = true;
    debug(MusicManager.STOP);
    this.emit(MusicManager.STOP);
  }

  [Symbol.iterator]() {
    // yield * this._playlist;
    let index = -1;
    const data = this._playlist;

    return {
      next: () => ({ value: data[++index], done: !(index in data) })
    };
  }

  complete() {
    return this._isCompleted;
  }

  play() {}

  pause() {}
}

MusicManager.CLASS_NAME = 'MusicManager:';
MusicManager.LOAD = `${MusicManager.CLASS_NAME}LOAD`;
MusicManager.PALY = `${MusicManager.CLASS_NAME}PLAY`;
MusicManager.END = `${MusicManager.CLASS_NAME}END`;
MusicManager.PAUSE = `${MusicManager.CLASS_NAME}PAUSE`;
MusicManager.STOP = `${MusicManager.CLASS_NAME}STOP`;

export default MusicManager;
