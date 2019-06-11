import React, { Component } from 'react';
import { ipcRenderer } from 'electron';
import moment from 'moment';
import { Card, Col, Collapse, Icon, Input, Row, Statistic } from 'antd';
import st from './index.css';
import ipcs from '../../constants/ipcs';
import { setDocTitle } from '../../utils/custUtil';
import { cachePath, logPath, open } from '../../utils/pathUtil';

const { Panel } = Collapse;
const { Search } = Input;

const { Countdown } = Statistic;

const debug = require('debug')('controlPanel');

export default class ControlPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      playInfo: `[${moment().format('hh:mm:ss')}]: 初始化成功`,
      expandIconPosition: 'left',
      prepareTaskStatus: false,
      prepareTaskTimeLeft: 0,
      prepareTaskMsg: '',
      clearTaskStatus: false,
      clearTaskTimeLeft: 0,
      clearTaskMsg: ''
    };
    ipcRenderer.on(ipcs.PLAY_INFO, (event, args) => {
      const { playInfo } = this.state;
      this.setState({
        playInfo: `[${moment().format('hh:mm:ss')}]: ${args}\n${playInfo}`
      });
    });

    ipcRenderer.on('control-panel-accept', (event, args) => {
      debug('接收到来自task的信息：', args);
      if (args.type === 'prepareTask') {
        this.setState({
          prepareTaskStatus: args.taskStatus,
          prepareTaskTimeLeft: args.timeLeft,
          prepareTaskMsg: args.msg
        });
      }

      if (args.type === 'clearTask') {
        this.setState({
          clearTaskStatus: args.taskStatus,
          clearTaskTimeLeft: args.timeLeft,
          clearTaskMsg: args.msg
        });
      }
    });

    ipcRenderer.send('dispatch-to-prepare-task', 'ping');

    ipcRenderer.send('dispatch-to-clear-task', 'ping');

    setDocTitle('控制面板');
  }

  render() {
    const {
      playInfo,
      expandIconPosition,
      prepareTaskStatus,
      prepareTaskTimeLeft,
      prepareTaskMsg,
      clearTaskStatus,
      clearTaskTimeLeft,
      clearTaskMsg
    } = this.state;
    return (
      <div className={st['control-panel']}>
        <Collapse
          className={st['control-panel-collapse']}
          defaultActiveKey={['1']}
          expandIconPosition={expandIconPosition}
        >
          <Panel
            className={st['control-panel-collapse-panel']}
            header="播放控制台"
            key="1"
            extra={<Icon type="alert" />}
          >
            <div className={st['control-panel-collapse-panel-logger']}>
              {playInfo}
            </div>
          </Panel>
          <Panel
            className={st['control-panel-collapse-panel']}
            header="定时作业"
            key="2"
            extra={<Icon type="dashboard" />}
          >
            <div className={st['control-panel-collapse-panel-task']}>
              <Row gutter={16}>
                <Col span={12}>
                  {!prepareTaskStatus ? (
                    <Countdown
                      title="检查次日计划"
                      value={prepareTaskTimeLeft}
                      format="HH:mm:ss:SSS"
                    />
                  ) : (
                    <span>{prepareTaskMsg}</span>
                  )}
                </Col>
                <Col span={12}>
                  {!clearTaskStatus ? (
                    <Countdown
                      title="清理无效缓存"
                      value={clearTaskTimeLeft}
                      format="D 天 H 时 m 分 s 秒"
                    />
                  ) : (
                    <span>{clearTaskMsg}</span>
                  )}
                </Col>
              </Row>
            </div>
          </Panel>
          <Panel
            className={st['control-panel-collapse-panel']}
            header="音乐缓存"
            key="3"
            extra={<Icon type="customer-service" />}
          >
            <div className={st['control-panel-collapse-panel-cache']}>
              <div className={st['control-panel-collapse-panel-cache-input']}>
                <Search
                  placeholder="file://"
                  value={cachePath()}
                  enterButton="更改"
                  disabled
                  addonBefore={<span>目录</span>}
                  onSearch={value => console.log(value)}
                />
              </div>
              <Icon
                onClick={open.bind(this, cachePath())}
                style={{ marginLeft: 10, fontSize: 20 }}
                type="folder-open"
              />
            </div>
          </Panel>
          <Panel
            className={st['control-panel-collapse-panel']}
            header="日志监控"
            key="4"
            extra={<Icon type="file-text" />}
          >
            <Card title="客户端更新日志" size="small">
              <div className={st['control-panel-collapse-panel-log']}>
                <div className={st['control-panel-collapse-panel-log-input']}>
                  <Search
                    placeholder="file://"
                    enterButton="更改"
                    value={logPath()}
                    disabled
                    addonBefore={<span>目录</span>}
                    onSearch={value => console.log(value)}
                  />
                </div>
                <Icon
                  onClick={open.bind(this, logPath())}
                  style={{ marginLeft: 10, fontSize: 20 }}
                  type="folder-open"
                />
              </div>
            </Card>
            <Card title="缓存日志" size="small" style={{ marginTop: 10 }}>
              <div className={st['control-panel-collapse-panel-log']}>
                <div className={st['control-panel-collapse-panel-log-input']}>
                  <Search
                    placeholder="file://"
                    enterButton="更改"
                    value={logPath()}
                    disabled
                    addonBefore={<span>目录</span>}
                    onSearch={value => console.log(value)}
                  />
                </div>
                <Icon
                  onClick={open.bind(this, logPath())}
                  style={{ marginLeft: 10, fontSize: 20 }}
                  type="folder-open"
                />
              </div>
            </Card>
            <Card title="全局错误日志" size="small" style={{ marginTop: 10 }}>
              <div className={st['control-panel-collapse-panel-log']}>
                <div className={st['control-panel-collapse-panel-log-input']}>
                  <Search
                    placeholder="file://"
                    enterButton="更改"
                    value={logPath()}
                    disabled
                    addonBefore={<span>目录</span>}
                    onSearch={value => console.log(value)}
                  />
                </div>
                <Icon
                  onClick={open.bind(this, logPath())}
                  style={{ marginLeft: 10, fontSize: 20 }}
                  type="folder-open"
                />
              </div>
            </Card>
          </Panel>
        </Collapse>
        <br />
      </div>
    );
  }
}
