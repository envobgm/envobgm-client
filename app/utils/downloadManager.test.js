/* eslint-disable global-require */
function testFileExists() {
  const FS = require('fs');
  const Promise = require('bluebird');

  const fs = Promise.promisifyAll(FS);
  const os = require('os');
  const path = require('path');

  fs.exists(path.join(os.homedir(), '.bgm', '初始化音频文件.mp3'), exists => {
    console.log(exists);
  });
}

testFileExists();
