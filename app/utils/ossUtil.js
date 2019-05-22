const OSS = require('ali-oss');

const Client = OSS;

export default class OssUtil {
  constructor(token) {
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
  signatureUrl(ossPath) {
    // 获取资源文件路径
    const startIndex = ossPath.indexOf('.com/') + 5;
    const endIndex = ossPath.length;
    const path = ossPath.substring(startIndex, endIndex);

    // 计算 URL 签名信息
    const url = this._store.signatureUrl(path, {
      expires: 3600,
      method: 'GET'
    });

    return url;
  }
}
