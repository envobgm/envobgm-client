/* eslint-disable prefer-rest-params */
const debug = require('debug')('apiProxy');

function request(msg) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        status: 1000,
        errorMessage: null,
        data: { msg }
      });
    }, 1000);
  });
}

function RequestProxy() {
  return new Proxy(request, {
    async apply() {
      debug('代理一部分前置工作...');
      const data = await Reflect.apply(...arguments);
      // throw new Error('shit...occured something wrong!!!');
      debug('获取返回结果，并代理一部分后置工作', data);
      return data;
    }
  });
}

(async function() {
  const proxy = new RequestProxy();
  const data = await proxy('hello');
  debug('返回结果：', data);
})();
