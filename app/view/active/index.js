/* eslint-disable no-shadow,no-underscore-dangle,react/no-unused-state,no-plusplus,react/destructuring-assignment,react/prop-types,no-unused-vars */
import React, { Component } from 'react';
import { Alert, Button, Input, Row, Spin, Steps } from 'antd';
import { ipcRenderer } from 'electron';
import Debug from 'debug';
import cust from '../../utils/cust';
import st from './index.css';
import GetDB from '../../utils/db';
import { active } from '../../api';

const debug = Debug('active');

const { Step } = Steps;

const steps = [
  {
    title: '激活客户端',
    content: '客户端和机器是一起绑定激活的，换机器需要重新激活',
    fail: '激活客户端失败，请联系管理员'
  },
  {
    title: '成功',
    content: '已经准备成功，歌曲将自动开始播放'
  }
];

class ActivePage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      current: 0,
      canNext: true,
      loading: false,
      title: '激活客户端',
      content: '客户端和机器是一起绑定激活的，换机器需要重新激活'
    };
    this._activeCode = null;
    this._dlDone = this.props.location.state
      ? this.props.location.state.dlDone
      : 0;
    this._dlState = this.props.location.state
      ? this.props.location.state.dlState
      : true;
    this._userAgent = navigator.userAgent.toLowerCase();
    this._wait = cust.wait;
    ipcRenderer.send('resize', 700, 500);
  }

  // 进行每一步的操作
  async next(auto = false) {
    const { current } = this.state;
    if (current === 0 && this._activeCode) {
      try {
        const ac = await this.active(auto);
        if (!ac) return;
        this._wait(() => {
          this.props.history.push('/');
        });
      } catch (err) {
        this._wait(() => window.location.reload());
        this.setState({
          title: '该激活码已过期，请联系供应商重新获取。',
          content: JSON.stringify(err)
        });
      }
    }
  }

  async active(auto) {
    let { current } = this.state;

    // 激活过就不用再激活了
    if (auto) {
      current++;
      this.setState({
        current,
        title: steps[current].title,
        content: steps[current].content
      });
      return true;
    }

    let ret = true;
    // 远程激活
    this.setState({ canNext: false, loading: true });
    try {
      ret = await active(this._activeCode);
      // 手动进入，需要保存code
      GetDB().insert({ activeCode: this._activeCode });
    } catch (err) {
      // 清除激活碼
      GetDB().remove({}, { multi: true });
      ret = false;
      throw err;
    }
    if (ret) {
      current++;
      this.setState({
        current,
        title: steps[current].title,
        content: steps[current].content
      });
    } else {
      this.setState({
        current,
        title: steps[current].title,
        content: steps[current].fail
      });
      this.setState({ canNext: true, loading: false });
    }
    return ret;
  }

  onChangeActiveCode = e => {
    this._activeCode = e.target.value;
  };

  // https://ant.design/components/steps-cn/
  render() {
    const { current } = this.state;

    const active = (
      <div>
        <div className={st.stepsContent}>
          <Row
            type="flex"
            justify="center"
            align="middle"
            className={st.stepsContent}
          >
            <Spin spinning={this.state.loading}>
              <Alert
                message={this.state.title}
                description={this.state.content}
                type="info"
              />
            </Spin>
          </Row>
          <div className="steps-action">
            <div>
              {this.state.current === 0 && !this.state.loading && (
                <Row type="flex" justify="center" align="middle">
                  <Input
                    placeholder="请输入激活码"
                    style={{ width: 400, textAlign: 'center', margin: 10 }}
                    onChange={this.onChangeActiveCode}
                  />
                  <Button type="primary" onClick={() => this.next()}>
                    激活{' '}
                  </Button>
                </Row>
              )}
            </div>
          </div>
        </div>
      </div>
    );

    return (
      <div className={st.stepHeader}>
        <Steps current={current}>
          {steps.map(item => (
            <Step key={item.title} title={item.title} />
          ))}
        </Steps>
        {active}
      </div>
    );
  }
}

export default ActivePage;
