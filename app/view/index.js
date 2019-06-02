// @flow
import React, { Component } from 'react';
import { Icon } from 'antd';
import Debug from 'debug';
import { Howler } from 'howler';
import { ipcRenderer } from 'electron';
import st from './index.css';
import logo from '../static/img/logo.svg';
import Switch from './components/switch';
import Time from './components/time';
import Progress from './components/progress';
import Volume from './components/volume';
import LaunchManager from '../core/launchManager';
import { Player, player } from '../core/pattern/observer/player';
import { version } from '../../package';
import ipcs from '../constants/ipcs';

const debug = Debug('player');

export default class Home extends Component {
  constructor(props) {
    super(props);

    this._startProcessManager = null;

    this.state = {
      open: true,
      process: 0,
      duration: 0,
      seek: 0,
      volume: 0,
      loading: false,
      loadingText: '检查更新'
    };

    player._publish(Player.RESIZE_HOME_WIN);
  }

  componentDidMount() {
    this.start();
  }

  shouldComponentUpdate() {
    if (this._startProcessManager) {
      return true;
    }
    return false;
  }

  componentWillUnmount() {
    this._startProcessManager._end();
  }

  // 启动流程
  start = async () => {
    const options = {
      updateUI: (status, tips) =>
        this.setState({ loading: status, loadingText: tips }),
      updateCfg: volume => this.setState({ volume }),
      updateInfo: (seek, process, duration) =>
        this.setState({ seek, process, duration })
    };
    this._startProcessManager = new LaunchManager(options);
    await this._startProcessManager.run();
  };

  // 开关
  onSwitch = () => {
    const { open } = this.state;
    if (!open) {
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
    ipcRenderer.send(ipcs.CLOSE);
  };

  // 隐藏/最小化
  onHide = () => {
    ipcRenderer.send(ipcs.HIDE);
  };

  // 加载缓存的UI
  loadCacheUI = () => {
    const { loading, loadingText } = this.state;
    if (this._startProcessManager) {
      const execDownload = this._startProcessManager._execDownload;
      if (loading) {
        return (
          <div className={st.leftTopBtnsGroup}>
            <Icon className={st.leftTopBtnStyle} type="sync" spin />
            <span className={st.loadingText}>{loadingText}</span>
          </div>
        );
      }
      return (
        <div
          tabIndex="0"
          role="button"
          onClick={execDownload.bind(this._startProcessManager)}
          onKeyDown={null}
          className={st.leftTopBtnsGroup}
        >
          <Icon className={st.leftTopBtnStyle} type="sync" />
          <span className={st.loadingText}>{loadingText}</span>
        </div>
      );
    }
    return (
      <div
        tabIndex="0"
        role="button"
        onClick={() => window.location.reload()}
        onKeyDown={null}
        className={st.leftTopBtnsGroup}
      >
        <Icon className={st.leftTopBtnStyle} type="sync" />
        <span className={st.loadingText}>重新启动</span>
      </div>
    );
  };

  render() {
    const { volume, open } = this.state;
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
      <div className={st.container}>
        <header className={st.albumart}>
          <section className={st.topStyle}>
            {this.loadCacheUI()}
            <div className={st.rightTopBtnsGroup}>
              <span style={{ whiteSpace: 'nowrap' }}>v{version}</span>
              <Icon
                onClick={this.onHide}
                className={st.rightTopBtnStyle}
                type="minus-square"
              />
              <Icon
                onClick={this.onClose}
                className={st.rightTopBtnStyle}
                type="close-square"
              />
            </div>
          </section>
          <div className={st.profile}>
            <div className={st.currentInfo} />
            <img src={logo} className={st.logo} alt="logo" />
            <div className={st.currentInfo} />
          </div>
        </header>
        <section className={st.ctrlWrapper}>
          <div className={st.controls}>
            <Time secs={seek} />
            <Progress process={process} />
            <Time secs={duration} />
            <Volume volume={volume} onChange={this.onVolume} />
            <Switch open={open} onSwitch={this.onSwitch} />
          </div>
        </section>
      </div>
    );
  }
}
