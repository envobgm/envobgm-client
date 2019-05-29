import fetch from 'isomorphic-fetch';
import { macAddr as getMacAddr } from './custUtil';

/**
 * 使用Promise封装Fetch，具有网络超时、请求终止的功能
 */
class NetUtil {
  static baseUrl = (function getBaseUrl() {
    if (process.env.NODE_ENV === 'production') {
      return 'http://47.103.63.249'; // 生产
    }
    return 'http://47.103.63.249'; // 测试
  })();

  static xMac;

  /**
   * post请求
   * url : 请求地址
   * data : 参数(Json对象)
   * callback : 回调函数
   * */
  static async fetchRequest(url, method, params) {
    if (!NetUtil.xMac) {
      NetUtil.xMac = await getMacAddr();
    }

    const header = {
      Accept: 'application/json',
      'Content-Type': 'application/json;charset=UTF-8',
      'X-Mac': NetUtil.xMac
    };
    let promise = null;
    if (typeof method === 'undefined') {
      promise = new Promise((resolve, reject) => {
        fetch(NetUtil.baseUrl + url, { method, headers: header })
          .then(response => response.json())
          .then(responseData => resolve(responseData))
          .catch(err => reject(err));
      });
    } else {
      promise = new Promise((resolve, reject) => {
        fetch(NetUtil.baseUrl + url, {
          method,
          headers: header,
          body: JSON.stringify(params)
        })
          .then(response => response.json())
          .then(responseData => resolve(responseData))
          .catch(err => reject(err));
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
  static warpFetch(fetchPromise, timeout = 10000) {
    let timeoutFn = null;
    let abort = null;
    // 创建一个超时promise
    const timeoutPromise = new Promise((resolve, reject) => {
      timeoutFn = function() {
        reject(new Error('网络请求超时'));
      };
    });
    // 创建一个终止promise
    const abortPromise = new Promise((resolve, reject) => {
      abort = function() {
        reject(new Error('请求终止'));
      };
    });
    // 竞赛
    const abortablePromise = Promise.race([
      fetchPromise,
      timeoutPromise,
      abortPromise
    ]);
    // 计时
    setTimeout(timeoutFn, timeout);
    // 终止
    abortablePromise.abort = abort;
    return abortablePromise;
  }
}

NetUtil.POST = 'post';
NetUtil.GET = 'get';
NetUtil.DELETE = 'delete';
NetUtil.PUT = 'put';
NetUtil.PATCH = 'patch';

export default NetUtil;
