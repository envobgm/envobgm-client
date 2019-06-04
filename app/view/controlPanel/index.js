import React, { Component } from 'react';
import { ipcRenderer } from 'electron';
import moment from 'moment';
import { Card, Col, Collapse, Icon, Input, Row, Statistic } from 'antd';
import st from './index.css';
import ipcs from '../../constants/ipcs';
import { setDocTitle } from '../../utils/custUtil';
import { cachePath, logPath, open } from '../../utils/pathUtil';
import { checkTaskDeadline } from '../../task/preparePlanTask';
import { clearTaskDeadline } from '../../task/clearCacheTask';

const { Panel } = Collapse;
const { Search } = Input;

const { Countdown } = Statistic;

let checkDeadline = checkTaskDeadline();
let cacheDeadline = clearTaskDeadline();

function onCheckFinish() {
  checkDeadline = checkTaskDeadline();
}

function onCacheFinish() {
  cacheDeadline = checkTaskDeadline();
}

export default class ControlPanel extends Component {
  constructor(props) {
    super(props);

    this.state = {
      playInfo: `[${moment().format('hh:mm:ss')}]: 初始化成功`,
      expandIconPosition: 'left'
    };

    ipcRenderer.on(ipcs.PLAY_INFO, (event, args) => {
      const { playInfo } = this.state;
      this.setState({
        playInfo: `[${moment().format('hh:mm:ss')}]: ${args}\n${playInfo}`
      });
    });

    setDocTitle('控制面板');
  }

  render() {
    const { playInfo, expandIconPosition } = this.state;
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
                  <Countdown
                    title="检查次日计划"
                    value={cacheDeadline}
                    onFinish={onCacheFinish}
                    format="HH:mm:ss:SSS"
                  />
                </Col>
                <Col span={12}>
                  <Countdown
                    title="清理无效缓存"
                    value={checkDeadline}
                    onFinish={onCheckFinish}
                    format="D 天 H 时 m 分 s 秒"
                  />
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
