// @flow
/* eslint-disable react/destructuring-assignment,react/jsx-no-comment-textnodes,no-underscore-dangle,react/no-unused-state */
import React, { Component } from 'react';
import { Icon } from 'antd';
import Debug from 'debug';
import { Howler } from 'howler';
import { ipcRenderer } from 'electron';
import ep from './index.css';
import logo from '../image/logo.svg';
import Switch from './components/switch';
import Time from './components/time';
import Progress from './components/progress';
import Volume from './components/volume';
import { invokeClearTask } from '../task/clearCacheTask';
import Logic from './logic';
import { version } from '../../package';

const debug = Debug('player');

const topStyle = {
  padding: '0.1rem 0.5rem',
  display: 'flex',
  flexDirection: 'row',
  backgroundColor: 'transparent',
  height: '25px',
  justifyContent: 'space-between'
};
const dragRegionStyle = {
  zIndex: 99,
  width: '100%',
  height: '100%',
  WebkitAppRegion: 'drag',
  WebkitUserSelect: 'none'
};
const rightTopBtnStyle = {
  fontSize: 16,
  zIndex: 100,
  marginLeft: 8
};
const leftTopBtnStyle = {
  fontSize: 16,
  zIndex: 100
};

export default class Home extends Component {
  constructor(props) {
    super(props);

    this._startProcessManager = null;

    this.state = {
      brand: 'Unknown Brand', // 品牌
      branchStore: 'Unknown Branch Store', // 分店名称
      currentPlaylist: 'Unknown Playlist', // 当前歌单
      currentArtist: 'Unknown Artist', // 当前作者
      currentSong: 'Unknown Song', // 当前歌曲
      open: true,
      process: 0,
      duration: 0,
      seek: 0,
      volume: 0,
      loading: false,
      loadingText: '检查更新'
    };

    ipcRenderer.send('resize', 500, 270);
    // 启动定时清除缓存计划
    invokeClearTask();
  }

  async componentWillMount() {
    const options = {
      updateUI: (status, tips) =>
        this.setState({ loading: status, loadingText: tips }),
      updateCfg: volume => this.setState({ volume }),
      updateInfo: (seek, process, duration) =>
        this.setState({ seek, process, duration })
    };
    this._startProcessManager = new Logic(options);
    await this._startProcessManager.run();
  }

  componentWillUnmount() {
    this._startProcessManager._end();
  }

  // 开关
  onSwitch = () => {
    if (!this.state.open) {
      this.onPlay();
    } else {
      this.onPause();
    }
  };

  // 音量
  onVolume = volume => {
    debug(`volume => ${volume}`);
    this.setState({ volume }, () => {
      Howler.volume(volume / 100);
    });
  };

  // 播放
  onPlay = () => {
    this._startProcessManager._musicSchedule._playlistManager.play();
    this.setState({ open: true });
  };

  // 暂停
  onPause = () => {
    this._startProcessManager._musicSchedule._playlistManager.pause();
    this.setState({ open: false });
  };

  // 关闭播放器
  onClose = () => {
    ipcRenderer.send('close');
  };

  // 隐藏/最小化
  onHide = () => {
    ipcRenderer.send('hide');
  };

  render() {
    let { seek, duration, process } = this.state;
    /**
     * 还不知道啥原因，howl返回的类型不对
     */
    (function parseNumber() {
      if (typeof seek !== 'number') seek = 0;
      if (typeof duration !== 'number') duration = 0;
      if (typeof process !== 'number') process = 0;
    })();

    return (
      <div className={ep.container}>
        <header className={ep.albumart}>
          <section style={topStyle}>
            {/* eslint-disable no-underscore-dangle */
            /* eslint-disable
            jsx-a11y/click-events-have-key-events */
            /* eslint-disable
            jsx-a11y/no-static-element-interactions */
            /* eslint-disable
            jsx-a11y/click-events-have-key-events */
            /* eslint-disable
            jsx-a11y/click-events-have-key-events */
            /* eslint-disable
            jsx-a11y/no-static-element-interactions */
            /* eslint-disable
            jsx-a11y/no-static-element-interactions */
            /* eslint-disable
            jsx-a11y/click-events-have-key-events */
            /* eslint-disable
            jsx-a11y/no-static-element-interactions */
            /* eslint-disable
            no-underscore-dangle */
            /* eslint-disable
            jsx-a11y/click-events-have-key-events */
            /* eslint-disable
            jsx-a11y/click-events-have-key-events */
            /* eslint-disable
            jsx-a11y/no-static-element-interactions */
            /* eslint-disable
            jsx-a11y/click-events-have-key-events */
            /* eslint-disable
            jsx-a11y/click-events-have-key-events */
            /* eslint-disable
            jsx-a11y/click-events-have-key-events */}
            {(function(context) {
              const { loading, loadingText } = context.state;
              if (loading) {
                return (
                  <div className={ep.leftTopBtnsGroup}>
                    <Icon style={leftTopBtnStyle} type="sync" spin />
                    <span className={ep.loadingText}>{loadingText}</span>
                  </div>
                );
              }
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/click-events-have-key-events,jsx-a11y/click-events-have-key-events
              return (
                // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/click-events-have-key-events
                // eslint-disable-next-line jsx-a11y/no-static-element-interactions,jsx-a11y/click-events-have-key-events
                <div
                  // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                  onClick /* eslint-disable no-underscore-dangle */={context._startProcessManager._execDownload.bind(
                    context._startProcessManager
                  )}
                  className={ep.leftTopBtnsGroup}
                >
                  <Icon style={leftTopBtnStyle} type="sync" />
                  <span className={ep.loadingText}>{loadingText}</span>
                </div>
              );
            })(this)}
            <div style={dragRegionStyle} />
            <div className={ep.rightTopBtnsGroup}>
              <span style={{ whiteSpace: 'nowrap' }}>v{version}</span>
              <Icon
                onClick={this.onHide}
                style={rightTopBtnStyle}
                type="minus-square"
              />
              <Icon
                onClick={this.onClose}
                style={rightTopBtnStyle}
                type="close-square"
              />
            </div>
          </section>
          <div className={ep.profile} style={dragRegionStyle}>
            <div className={ep.currentInfo}>
              {/* <p>{this.state.brand}</p> */}
              {/* <p>{this.state.branchStore}</p> */}
            </div>
            <img src={logo} className={ep.logo} alt="logo" />
            <div className={ep.currentInfo}>
              {/* <p>{this.state.currentPlaylist}</p> */}
              {/* <p>{this.state.currentArtist}</p> */}
              {/* <p>{this.state.currentSong}</p> */}
            </div>
          </div>
        </header>
        <section className={ep.ctrlWrapper}>
          <div className={ep.controls}>
            <Time secs={seek} />
            <Progress process={process} />
            <Time secs={duration} />
            <Volume volume={this.state.volume} onChange={this.onVolume} />
            <Switch open={this.state.open} onSwitch={this.onSwitch} />
          </div>
        </section>
      </div>
    );
  }
}
