/* eslint-disable camelcase,no-underscore-dangle,new-cap */
Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.random = random;
exports.wait = wait;
exports.macAddr = macAddr;

const _child_process = _interopRequireDefault(require('child_process'));

const _bluebird = _interopRequireDefault(require('bluebird'));

const _os = _interopRequireDefault(require('os'));

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

const macRegExp = /(([a-f0-9]{2}:)|([a-f0-9]{2}-)){5}[a-f0-9]{2}/gi;

/**
 * 获取随机整数
 * @param max
 * @param min
 * @returns {*}
 */

function random(max, min) {
  return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * 指定时间内造成阻塞
 * @param callback
 * @param ms
 * @returns {Promise<void>}
 */

async function wait(callback, ms) {
  await _bluebird.default.delay(ms || 3000).then(callback);
}

/**
 * 获取mac地址
 */

function macAddr() {
  return new _bluebird.default(function(resolve, reject) {
    // Mac | Linux
    if (
      _os.default.platform() === 'darwin' ||
      _os.default.platform() === 'linux'
    ) {
      _child_process.default.exec('ifconfig', function(error, stdout, stderr) {
        if (error) {
          reject(stderr);
        }

        resolve(stdout.match(macRegExp)[0]);
      });
    } // Windows
    else {
      _child_process.default.exec('ipconfig/all', function(
        error,
        stdout,
        stderr
      ) {
        if (error) {
          reject(stderr);
        }

        resolve(stdout.match(macRegExp)[0]);
      });
    }
  });
}
