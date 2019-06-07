/* eslint-disable class-methods-use-this,prettier/prettier */
import { Howl } from 'howler';
import HowlShop from './howlShop';

export default class MusicFactory extends HowlShop {
  createHowl(model) {
    const howl = new Howl({
      src: model.src,
      autoplay: false,
      onload: model.onload,
      onplay: model.onplay,
      onend: model.onend,
      onpause: model.onpause,
      onstop: model.onstop
    });
    return howl;
  }
}
