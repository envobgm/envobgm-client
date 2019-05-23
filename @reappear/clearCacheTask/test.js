/* eslint-disable import/order */
const { cherryCached, extractTracks } = require('../es5-build/cache');
const dbUtil = require('../es5-build/dbUtil').default;
const debug = require('debug')('test');

(async function() {
  const plan = await dbUtil.getPlayerPlan();
  const {
    cachedPlaylists,
    cachedScrollAudioMessage,
    cachedAlarmAudioMessages
  } = await cherryCached(plan);
  const cachedFiles = [
    ...extractTracks(cachedPlaylists),
    ...cachedAlarmAudioMessages,
    ...cachedScrollAudioMessage
  ].map(item => item.filePathName);
  // cachedFiles.splice(
  //   cachedFiles.indexOf('/Users/yanzhi.mo/.bgm/国庆 (29).mp3'),
  //   1
  // );
  debug(
    '是否包含文件：',
    cachedFiles.includes('/Users/yanzhi.mo/.bgm/国庆 (29).mp3')
  );
  return cachedFiles;
})();
