/* eslint-disable no-underscore-dangle,no-void,no-func-assign,new-cap,no-plusplus,no-param-reassign,prefer-rest-params,promise/always-return,no-return-await,eqeqeq,no-shadow,prefer-const,no-proto */
Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = void 0;

const _os = _interopRequireDefault(require('os'));

const _path = _interopRequireDefault(require('path'));

const _fileSystem = _interopRequireDefault(require('file-system'));

const _fs = _interopRequireDefault(require('fs'));

const _events = _interopRequireDefault(require('events'));

const _download = _interopRequireDefault(require('download'));

const _debug = _interopRequireDefault(require('debug'));

const _bluebird = _interopRequireDefault(require('bluebird'));

const _crypto = _interopRequireDefault(require('crypto'));

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

function _typeof(obj) {
  if (typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol') {
    _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj &&
        typeof Symbol === 'function' &&
        obj.constructor === Symbol &&
        obj !== Symbol.prototype
        ? 'symbol'
        : typeof obj;
    };
  }
  return _typeof(obj);
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

function _possibleConstructorReturn(self, call) {
  if (call && (_typeof(call) === 'object' || typeof call === 'function')) {
    return call;
  }
  return _assertThisInitialized(self);
}

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError(
      "this hasn't been initialised - super() hasn't been called"
    );
  }
  return self;
}

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf
    ? Object.getPrototypeOf
    : function _getPrototypeOf(o) {
        return o.__proto__ || Object.getPrototypeOf(o);
      };
  return _getPrototypeOf(o);
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== 'function' && superClass !== null) {
    throw new TypeError('Super expression must either be null or a function');
  }
  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: { value: subClass, writable: true, configurable: true }
  });
  if (superClass) _setPrototypeOf(subClass, superClass);
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf =
    Object.setPrototypeOf ||
    function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };
  return _setPrototypeOf(o, p);
}

const debug = (0, _debug.default)('downloadManager');

const fs = _bluebird.default.promisifyAll(_fs.default); // 检查是否下载了所有音乐，如果没有提示用户：有没有下载的音乐，是否立刻下载 | 取消播放 | 定时下载
// 所以当全部音乐准备好之前，是不会播放的。

const DownloadManager =
  /* #__PURE__ */
  (function(_EventEmitter) {
    _inherits(DownloadManager, _EventEmitter);

    function DownloadManager(playlist, dir) {
      let _this;

      _classCallCheck(this, DownloadManager);

      _this = _possibleConstructorReturn(
        this,
        _getPrototypeOf(DownloadManager).call(this)
      );
      _this._cached = [];
      _this._unCached = [];
      _this._playlist = playlist;
      _this._dir = dir || _path.default.join(_os.default.homedir(), '.bgm');
      return _this;
    } // 检查没有本地缓存的文件

    _createClass(DownloadManager, [
      {
        key: 'checkCache',
        value: function checkCache(playlist) {
          const _this2 = this;

          const obj = {
            cached: [],
            unCached: []
          };
          return _bluebird.default
            .reduce(
              this._playlist || playlist,
              async function(result, item) {
                const fileName = (item.filePathName = _path.default.join(
                  _this2._dir,
                  item.title
                ));

                return await new _bluebird.default(function(resolve) {
                  fs.exists(fileName, function(exists) {
                    if (exists) {
                      const rs = fs.createReadStream(fileName);

                      const hash = _crypto.default.createHash('md5');

                      rs.on('data', hash.update.bind(hash));
                      rs.on('end', function() {
                        const md5 = hash.digest('hex').toUpperCase(); // 删除不完整的文件，并统计到失败队列

                        if (md5 != item.md5) {
                          obj.unCached.push(item);
                          fs.unlinkSync(item.filePathName);
                        }
                      });
                      obj.cached.push(item);
                      resolve();
                    } else {
                      obj.unCached.push(item);
                      resolve();
                    }
                  });
                });
              },
              0
            )
            .then(function() {
              return obj;
            });
        }
      },
      {
        key: 'downloadWithConcurrency',
        value: function downloadWithConcurrency(unCached) {
          const _this3 = this;

          const concurrency =
            arguments.length > 1 && arguments[1] !== undefined
              ? arguments[1]
              : 3;
          return new _bluebird.default(function(resolve, reject) {
            try {
              _fileSystem.default.mkdirSync(_this3._dir, 493);
            } catch (e) {
              reject(e);
            }

            const result = {
              success: [],
              fail: []
            }; // debug('unCached : %o', unCached);

            if (unCached.length === 0) {
              const errorMsg = '没有需要下载的文件';

              _this3.emit(DownloadManager.ERROR, errorMsg);

              reject(errorMsg);
            } else {
              let count = 0;

              _bluebird.default.map(
                unCached,
                async function(item, i) {
                  await _this3
                    .downloadOneFile(item.file, item.filePathName)
                    .then(function() {
                      result.success.push(item);

                      _this3.emit(DownloadManager.PROGRESS, {
                        result: true,
                        currentObj: item,
                        currentIndex: count++,
                        arrayIndex: i
                      });
                    })
                    .catch(function(err) {
                      unCached[i].err = err;
                      result.fail.push(unCached[i]);

                      _this3.emit(DownloadManager.PROGRESS, {
                        result: false,
                        currentObj: item,
                        currentIndex: count++,
                        arrayIndex: i,
                        err
                      }); // 17/01/2018 - TAG: by yanzhi.mo - 失败的歌曲直接删除，这里做下代码重构。

                      fs.access(item.filePathName, function(error) {
                        if (!error) {
                          fs.unlinkSync(item.filePathName);
                        } else {
                          debug('fs.access error : %o', error);
                        }
                      });
                    });
                },
                {
                  concurrency
                }
              );
            } // else

            _this3.on(DownloadManager.PROGRESS, function(res) {
              if (res.currentIndex === unCached.length - 1) {
                resolve(result);
              }
            });
          });
        } // 下载没有缓存的文件
        // const result = {success: [], fail: []};
      },
      {
        key: 'downloadSeries',
        value: function downloadSeries(unCached) {
          const _this4 = this;

          return new _bluebird.default(function(resolve, reject) {
            try {
              _fileSystem.default.mkdirSync(_this4._dir, 493);
            } catch (e) {
              reject(e);
            }

            const result = {
              success: [],
              fail: []
            }; // debug('unCached : %o', unCached);

            if (unCached.length === 0) {
              const errorMsg = '没有需要下载的文件';

              _this4.emit(DownloadManager.ERROR, errorMsg);

              reject(errorMsg);
            } else {
              let count = 0;

              _bluebird.default.mapSeries(unCached, async function(item, i) {
                await _this4
                  .downloadOneFile(item.file, item.filePathName)
                  .then(function() {
                    result.success.push(item);

                    _this4.emit(DownloadManager.PROGRESS, {
                      result: true,
                      currentObj: item,
                      currentIndex: count++,
                      arrayIndex: i
                    });
                  })
                  .catch(function(err) {
                    unCached[i].err = err;
                    result.fail.push(unCached[i]);

                    _this4.emit(DownloadManager.PROGRESS, {
                      result: false,
                      currentObj: item,
                      currentIndex: count++,
                      arrayIndex: i,
                      err
                    });
                  });
              });

              _this4.on(DownloadManager.PROGRESS, function(res) {
                if (res.currentIndex === unCached.length - 1) {
                  resolve(result);
                }
              });
            } // else
          });
        }
      },
      {
        key: 'downloadOneFile',
        value: function downloadOneFile(fileUrl, filePathName) {
          return new _bluebird.default(function(resolve, reject) {
            let md5;
            let dmd5;

            const hash = _crypto.default.createHash('md5');

            const ws = fs.createWriteStream(filePathName, {
              flag: 'w'
            });
            const d = (0, _download.default)(fileUrl, {
              headers: {},
              useElectronNet: false // 哈哈，去掉就会崩溃，调了一下午
            });
            d.on('response', function(response) {
              md5 = response.headers['content-md5'];
            })
              .on('data', function(data) {
                hash.update(data, 'utf8');
              })
              .on('end', function() {
                dmd5 = hash.digest('base64'); // debug('md5 = %o, dmd5 = %o', md5, dmd5);
              })
              .on('error', function(err, body, response) {
                reject(err, body, response);
              })
              .pipe(ws);
            d.catch(function(err) {
              // debug('d.catch : %o', err);
              reject(err);
            });
            ws.on('finish', function() {
              if (md5 === dmd5) {
                resolve(true);
              } else {
                reject(
                  new Error(
                    'md5 is not correct, md5 in response '
                      .concat(md5, ', md5 for download file ')
                      .concat(dmd5)
                  )
                );
              }
            }).on('error', function(err) {
              reject(err);
            });
          });
        }
      }
    ]);

    return DownloadManager;
  })(_events.default);

exports.default = DownloadManager;
DownloadManager.PROGRESS = 'DownloadManager:progress';
DownloadManager.ERROR = 'DownloadManager:error'; //
// , function (err, stat) {
//   if (stat && stat.isFile()) {
//     cached.push(playlist[i]);
//   } else {
//     unCached.push(playlist[i]);
//   }
// }
