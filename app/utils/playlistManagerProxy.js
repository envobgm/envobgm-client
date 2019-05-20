/* eslint-disable no-underscore-dangle */

import { random } from './cust';

const debug = require('debug')('playlistManagerProxy.js');

/**
 * 播放管理器代理类
 * @param playlistManager
 * @returns {object}
 */
export default function proxy(playlistManager) {
  return new Proxy(playlistManager, {
    proxy: true,
    playlist: playlistManager._playlist,
    randoms: [],
    inedx: 0,

    get currentIndex() {
      return this.index;
    },

    set currentIndex(index) {
      this.index = index;
    },

    /**
     * @TODO: 随机播放
     */
    randomPlay() {
      if (this.randoms.length === 0) {
        debug('随机队列一轮播放结束');
        this.randoms = Object.keys(this.playlist);
      }
      this.index = this.randoms.splice(random(0, this.randoms.length), 1);
      debug('歌曲放完了，准备随机放下一首歌曲 ', this.playlist[this.index]);
    }

    /**
     * @TODO: 获取howl实例（单例模式）
     */
    /**
     * @TODO: 获取播放列表（检查是否切换）
     */
  });
}
