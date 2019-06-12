import { macAddr as getMacAddr, strToHexCharCode } from '../custUtil';

const debug = require('debug')('socket');

export default class Socket {
  static socket = null;

  static async getInstance() {
    if (!Socket.socket) {
      debug('创建单例socket');
      const mac = await getMacAddr();
      Socket.socket = new Socket(mac);
    }
    return Socket.socket;
  }

  constructor(mac) {
    this._socket = new WebSocket(
      `ws://47.103.63.249/ws/monitor/${strToHexCharCode(mac)}`
    );
  }

  send(info) {
    debug('发送报文：', info);
    this._socket.send(JSON.stringify(info));
  }
}
