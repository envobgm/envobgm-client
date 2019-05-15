/* eslint-disable no-underscore-dangle */
// TODO：水货alioss经过webpack以后会有问题，只好在网页里面加载好
const OSS = require('ali-oss');
// const OSS = require('ali-oss');
const Client = OSS.Wrapper;

/**
 * @class OssClient
 * @desc OSS客户端
 */
export default class OssClient {
  constructor(token) {
    // OSS 操作对象
    // debug(`token：${token}`);
    this.store = new Client({
      region: token.Region,
      bucket: token.Bucket,
      accessKeyId: token.AccessKeyId,
      accessKeySecret: token.AccessKeySecret,
      stsToken: token.SecurityToken
    });
    this._signatureUrl.bind(this);
  }

  /**
   * @method _signatureUrl
   * @desc 计算出携带签名的完整URL
   * @param {*} ossPath
   * @param {*} token
   */
  _signatureUrl(ossPath) {
    // 获取资源文件路径
    const startIndex = ossPath.indexOf('.com/') + 5;
    const endIndex = ossPath.length;
    const path = ossPath.substring(startIndex, endIndex);

    // 计算 URL 签名信息
    const url = this.store.signatureUrl(path, {
      expires: 3600,
      method: 'GET'
    });

    return url;
  }
}
