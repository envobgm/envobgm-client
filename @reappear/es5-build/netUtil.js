/* eslint-disable no-void,no-plusplus,no-param-reassign,no-shadow,prefer-rest-params */
Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = void 0;

const _isomorphicFetch = _interopRequireDefault(require('isomorphic-fetch'));

const _custUtil = require('./custUtil');

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function _instanceof(left, right) {
  if (
    right != null &&
    typeof Symbol !== 'undefined' &&
    right[Symbol.hasInstance]
  ) {
    return right[Symbol.hasInstance](left);
  }
  return left instanceof right;
}

function _classCallCheck(instance, Constructor) {
  if (!_instanceof(instance, Constructor)) {
    throw new TypeError('Cannot call a class as a function');
  }
}

function _defineProperties(target, props) {
  for (let i = 0; i < props.length; i++) {
    const descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ('value' in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}

/**
 * 使用Promise封装Fetch，具有网络超时、请求终止的功能
 */
const NetUtil =
  /* #__PURE__ */
  (function() {
    function NetUtil() {
      _classCallCheck(this, NetUtil);
    }

    _createClass(NetUtil, null, [
      {
        key: 'fetchRequest',

        /**
         * post请求
         * url : 请求地址
         * data : 参数(Json对象)
         * callback : 回调函数
         * */
        value: async function fetchRequest(url, method, params) {
          if (!NetUtil.xMac) {
            NetUtil.xMac = await (0, _custUtil.macAddr)();
          }

          const header = {
            Accept: 'application/json',
            'Content-Type': 'application/json;charset=UTF-8',
            'X-Mac': NetUtil.xMac
          };
          let promise = null;

          if (typeof method === 'undefined') {
            promise = new Promise(function(resolve, reject) {
              (0, _isomorphicFetch.default)(NetUtil.baseUrl + url, {
                method,
                headers: header
              })
                .then(function(response) {
                  return response.json();
                })
                .then(function(responseData) {
                  return resolve(responseData);
                })
                .catch(function(err) {
                  return reject(err);
                });
            });
          } else {
            promise = new Promise(function(resolve, reject) {
              (0, _isomorphicFetch.default)(NetUtil.baseUrl + url, {
                method,
                headers: header,
                body: JSON.stringify(params)
              })
                .then(function(response) {
                  return response.json();
                })
                .then(function(responseData) {
                  return resolve(responseData);
                })
                .catch(function(err) {
                  return reject(err);
                });
            });
          }

          return NetUtil.warpFetch(promise);
        }
        /**
         * 创建两个promise对象，一个负责网络请求，另一个负责计时，如果超过指定时间，就会先回调计时的promise，代表网络超时。
         * @param {Promise} fetchPromise    fetch请求返回的Promise
         * @param {number} [timeout=10000]   单位：毫秒，这里设置默认超时时间为10秒
         * @return 返回Promise
         */
      },
      {
        key: 'warpFetch',
        value: function warpFetch(fetchPromise) {
          const timeout =
            arguments.length > 1 && arguments[1] !== undefined
              ? arguments[1]
              : 10000;
          let timeoutFn = null;
          let abort = null; // 创建一个超时promise

          const timeoutPromise = new Promise(function(resolve, reject) {
            timeoutFn = function timeoutFn() {
              reject(new Error('网络请求超时'));
            };
          }); // 创建一个终止promise

          const abortPromise = new Promise(function(resolve, reject) {
            abort = function abort() {
              reject(new Error('请求终止'));
            };
          }); // 竞赛

          const abortablePromise = Promise.race([
            fetchPromise,
            timeoutPromise,
            abortPromise
          ]); // 计时

          setTimeout(timeoutFn, timeout); // 终止

          abortablePromise.abort = abort;
          return abortablePromise;
        }
      }
    ]);

    return NetUtil;
  })();

_defineProperty(
  NetUtil,
  'baseUrl',
  (function getBaseUrl() {
    if (process.env.NODE_ENV === 'production') {
      return 'http://47.103.63.249'; // 生产
    }

    return 'http://47.103.63.249'; // 测试
  })()
);

_defineProperty(NetUtil, 'xMac', void 0);

NetUtil.POST = 'post';
NetUtil.GET = 'get';
NetUtil.DELETE = 'delete';
NetUtil.PUT = 'put';
NetUtil.PATCH = 'patch';
const _default = NetUtil;
exports.default = _default;
