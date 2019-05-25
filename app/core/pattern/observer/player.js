import { ipcRenderer } from 'electron';
import ipcs from '../../../constants/ipcs';

/**
 * 发布订阅模式
 */
export class Player {
  constructor() {
    // 初始化观察者列表
    this.watchers = {};
  }

  // 发布事件
  _publish(event, data) {
    if (this.watchers[event] && this.watchers[event].length) {
      this.watchers[event].forEach(callback => callback.bind(this)(data));
    }
  }

  // 订阅事件
  subscribe(event, callback) {
    this.watchers[event] = this.watchers[event] || [];
    this.watchers[event].push(callback);
  }

  // 退订事件
  unsubscribe(event = null, callback = null) {
    // 如果传入指定事件函数，则仅退订此事件函数
    if (callback && event) {
      if (this.watchers[event] && this.watchers[event].length) {
        this.watchers[event].splice(
          this.watchers[event].findIndex(cb => Object.is(cb, callback)),
          1
        );
      }

      // 如果仅传入事件名称，则退订此事件对应的所有的事件函数
    } else if (event) {
      this.watchers[event] = [];

      // 如果未传入任何参数，则退订所有事件
    } else {
      this.watchers = {};
    }
  }
}

Player.RESIZE_ACTIVE_WIN = 'resizeActiveWin';
Player.RESIZE_HOME_WIN = 'resizeHomeWin';

// 实例化播放器
let singleton;
if (!singleton) {
  singleton = new Player();
}
export const player = singleton;

// 注册事件
const resizeActiveWin = function(w = 700, h = 500) {
  ipcRenderer.send(ipcs.RESIZE, w, h);
};

const resizeHomeWin = function(w = 500, h = 270) {
  ipcRenderer.send(ipcs.RESIZE, w, h);
};

// 可订阅多个不同事件
player.subscribe(Player.RESIZE_ACTIVE_WIN, resizeActiveWin);
player.subscribe(Player.RESIZE_HOME_WIN, resizeHomeWin);
