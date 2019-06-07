/* eslint-disable no-unused-vars,class-methods-use-this */
export default class HowlShop {
  sellHowl(model) {
    const howl = this.createHowl(model);
    return howl;
  }

  createHowl(model) {
    throw new Error('it must be realized by sub class');
  }
}
