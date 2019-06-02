/* eslint-disable no-void,no-plusplus,no-shadow */
Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = void 0;

const _electronLog = _interopRequireDefault(require('electron-log'));

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

const PlayLog =
  /* #__PURE__ */
  (function() {
    function PlayLog() {
      _classCallCheck(this, PlayLog);

      _electronLog.default.transports.file.level = 'info';
      _electronLog.default.transports.file.fileName = 'playLog.log';
      this._logger = _electronLog.default;
    }

    _createClass(PlayLog, [
      {
        key: 'debug',
        value: function debug(info) {
          this._logger.info(info);
        }
      }
    ]);

    return PlayLog;
  })();

exports.default = PlayLog;
