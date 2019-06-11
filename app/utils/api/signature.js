import moment from 'moment';
import OssUtil from '../ossUtil';

export default function calcSignature(dailyPlan, token) {
  const client = new OssUtil(token);
  const {
    playerConfig: {
      fadeInTime,
      fadeOutTime,
      playStartTime,
      playEndTime,
      playVolume,
      updateInstant
    },
    playLists,
    audioCutConfigs,
    audioCarouselConfig
  } = dailyPlan;

  // 播放列表
  const playlists = playLists.map(playlist => {
    return {
      startTm: moment(playlist.startTime)
        .utcOffset(-360)
        .format('HH:mm:ss'),
      endTm: moment(playlist.endTime)
        .utcOffset(-360)
        .format('HH:mm:ss'),
      uuid: playlist.id,
      tracks: playlist.tracks.map(({ name, etag, url }) => ({
        plUuid: playlist.id,
        title: `${name}.mp3`,
        md5: etag,
        file: client.signatureUrl(url),
        howl: null
      }))
    };
  });

  // 轮播语音
  const scrollAudioMessage = {
    frequency: audioCarouselConfig.frequency,
    title: `${audioCarouselConfig.audio.name}.mp3`,
    md5: audioCarouselConfig.audio.etag,
    file: client.signatureUrl(audioCarouselConfig.audio.url),
    howl: null
  };

  // 插播语音
  const alarmAudioMessages = audioCutConfigs.map(media => {
    const {
      cutTime,
      audio: { name, etag, url }
    } = media;
    return {
      alarmTm: moment(cutTime)
        .utcOffset(-360)
        .format('HH:mm:ss'),
      title: `${name}.mp3`,
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
      playerStartTm: moment(playStartTime)
        .utcOffset(-360)
        .format('HH:mm:ss'),
      playerEndTm: moment(playEndTime)
        .utcOffset(-360)
        .format('HH:mm:ss'),
      playerVolumn: playVolume,
      fadeInTm: fadeInTime,
      fadeOutTm: fadeOutTime,
      updateInstant: updateInstant * 1000
    }
  };
}
