/* eslint-disable no-void,no-underscore-dangle,no-plusplus,no-shadow */
Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = void 0;

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

const OSS = require('ali-oss');

const Client = OSS;

const OssUtil =
  /* #__PURE__ */
  (function() {
    function OssUtil(token) {
      _classCallCheck(this, OssUtil);

      this._store = new Client({
        region: token.Region,
        bucket: token.Bucket,
        accessKeyId: token.AccessKeyId,
        accessKeySecret: token.AccessKeySecret,
        stsToken: token.SecurityToken
      });
    }
    /**
     * 计算URL签名
     * @param ossPath
     * @returns {*}
     */

    _createClass(OssUtil, [
      {
        key: 'signatureUrl',
        value: function signatureUrl(ossPath) {
          // 获取资源文件路径
          const startIndex = ossPath.indexOf('.com/') + 5;
          const endIndex = ossPath.length;
          const path = ossPath.substring(startIndex, endIndex); // 计算 URL 签名信息

          const url = this._store.signatureUrl(path, {
            expires: 3600,
            method: 'GET'
          });

          return url;
        }
      }
    ]);

    return OssUtil;
  })();

exports.default = OssUtil;
