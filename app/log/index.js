// @TODO： 以后看下能不能做日志切割
import log from 'electron-log';

export default {
  browserErrorLog() {
    log.transports.file.level = 'error';
    return log;
  },

  clientUpdateLog() {
    log.transports.file.level = 'info';
    return log;
  },

  cacheLog() {
    log.transports.file.level = 'debug';
    return log;
  },

  playLog() {
    log.transports.file.level = 'verbose';
    return log;
  }
};
