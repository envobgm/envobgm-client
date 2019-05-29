/* eslint-disable new-cap */
Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = calcSignature;

const _moment = _interopRequireDefault(require('moment'));

const _ossUtil = _interopRequireDefault(require('./ossUtil'));

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function calcSignature(dailyPlan, token) {
  const client = new _ossUtil.default(token);
  const _dailyPlan$playerConf = dailyPlan.playerConfig;
  const { fadeInTime } = _dailyPlan$playerConf;
  const { fadeOutTime } = _dailyPlan$playerConf;
  const { playStartTime } = _dailyPlan$playerConf;
  const { playEndTime } = _dailyPlan$playerConf;
  const { playVolume } = _dailyPlan$playerConf;
  const { updateInstant } = _dailyPlan$playerConf;
  const { playLists } = dailyPlan;
  const { audioCutConfigs } = dailyPlan;
  const { audioCarouselConfig } = dailyPlan; // 播放列表

  const playlists = playLists.map(function(playlist) {
    return {
      startTm: (0, _moment.default)(playlist.startTime)
        .utcOffset(-360)
        .format('HH:mm:ss'),
      endTm: (0, _moment.default)(playlist.endTime)
        .utcOffset(-360)
        .format('HH:mm:ss'),
      uuid: playlist.id,
      tracks: playlist.tracks.map(function(_ref) {
        const { name } = _ref;
        const { etag } = _ref;
        const { url } = _ref;
        return {
          plUuid: playlist.id,
          title: ''.concat(name, '.mp3'),
          md5: etag,
          file: client.signatureUrl(url),
          howl: null
        };
      })
    };
  }); // 轮播语音

  const scrollAudioMessage = {
    frequency: audioCarouselConfig.frequency,
    title: ''.concat(audioCarouselConfig.audio.name, '.mp3'),
    md5: audioCarouselConfig.audio.etag,
    file: client.signatureUrl(audioCarouselConfig.audio.url),
    howl: null
  }; // 插播语音

  const alarmAudioMessages = audioCutConfigs.map(function(media) {
    const { cutTime } = media;
    const _media$audio = media.audio;
    const { name } = _media$audio;
    const { etag } = _media$audio;
    const { url } = _media$audio;
    return {
      alarmTm: (0, _moment.default)(cutTime)
        .utcOffset(-360)
        .format('HH:mm:ss'),
      title: ''.concat(name, '.mp3'),
      md5: etag,
      file: client.signatureUrl(url),
      howl: null
    };
  });
  return {
    playlists,
    scrollAudioMessage,
    alarmAudioMessages,
    setting: {
      playerStartTm: (0, _moment.default)(playStartTime)
        .utcOffset(-360)
        .format('HH:mm:ss'),
      playerEndTm: (0, _moment.default)(playEndTime)
        .utcOffset(-360)
        .format('HH:mm:ss'),
      playerVolumn: playVolume,
      fadeInTm: fadeInTime,
      fadeOutTm: fadeOutTime,
      updateInstant: updateInstant * 1000
    }
  };
}
