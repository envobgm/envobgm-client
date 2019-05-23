/* eslint-disable no-underscore-dangle,new-cap */
Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = calcSignature;

const _ossUtil = _interopRequireDefault(require('./ossUtil'));

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

/* eslint-disable no-underscore-dangle */
function calcSignature(dailyPlan, token) {
  const client = new _ossUtil.default(token);
  const playlists = dailyPlan.playlists.map(function(playlist, index) {
    return {
      ...playlist,
      uuid: index,
      tracks: playlist.tracks.map(function(media) {
        return {
          plUuid: index,
          title: media.name,
          md5: media.etag,
          file: client.signatureUrl(media.ossPath),
          howl: null
        };
      })
    };
  }); // 轮播语音

  let oss = dailyPlan.scrollAudioMessage.ossPath;
  const scrollAudioMessage = {
    frequency: dailyPlan.scrollAudioMessage.frequency,
    title:
      dailyPlan.scrollAudioMessage.name ||
      oss.substring(oss.lastIndexOf('/') + 1),
    md5: dailyPlan.scrollAudioMessage.etag,
    file: client.signatureUrl(dailyPlan.scrollAudioMessage.ossPath),
    howl: null
  }; // 插播语音

  const alarmAudioMessages = dailyPlan.alarmAudioMessages.map(function(media) {
    oss = media.ossPath;
    return {
      alarmTm: media.alarmTm,
      title: media.name || oss.substring(oss.lastIndexOf('/') + 1),
      md5: media.etag,
      file: client.signatureUrl(media.ossPath),
      howl: null
    };
  });
  return {
    playlists,
    scrollAudioMessage,
    alarmAudioMessages,
    setting: dailyPlan.setting,
    site: dailyPlan.site
  };
}
