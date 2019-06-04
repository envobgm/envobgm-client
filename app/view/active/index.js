import React, { Component } from 'react';
import { Alert, Button, Input, Row, Spin, Steps } from 'antd';
import { wait } from '../../utils/custUtil';
import st from './index.css';
import GetDB from '../../utils/dbUtil';
import { active } from '../../api';
import { history } from '../../store/configureStore';

// const debug = require('debug')('active');

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

type Props = {};

export default class ActivePage extends Component<Props> {
  constructor(props) {
    super(props);
    this.state = {
      current: 0,
      loading: false,
      title: '激活客户端',
      content: '客户端和机器是一起绑定激活的，换机器需要重新激活'
    };
    this.activeCode = null;
    this.wait = wait;
  }

  // 进行每一步的操作
  async next(auto = false) {
    const { current } = this.state;
    if (current === 0 && this.activeCode) {
      try {
        const ac = await this.active(auto);
        if (!ac) return;
        this.wait(() => {
          history.push('/');
        });
      } catch (err) {
        this.wait(() => window.location.reload());
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
      current += 1;
      this.setState({
        current,
        title: steps[current].title,
        content: steps[current].content
      });
      return true;
    }

    let ret = true;
    // 远程激活
    this.setState({ loading: true });
    try {
      ret = await active(this.activeCode);
      // 手动进入，需要保存code
      GetDB().insert({ activeCode: this.activeCode });
    } catch (err) {
      // 清除激活碼
      GetDB().remove({}, { multi: true });
      ret = false;
      throw err;
    }
    if (ret) {
      current += 1;
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
      this.setState({ loading: false });
    }
    return ret;
  }

  onChangeActiveCode = e => {
    this.activeCode = e.target.value;
  };

  // https://ant.design/components/steps-cn/
  render() {
    const { current, loading, title, content } = this.state;

    const activeUI = (
      <div>
        <div className={st.stepsContent}>
          <Row
            type="flex"
            justify="center"
            align="middle"
            className={st.stepsContent}
          >
            <Spin spinning={loading}>
              <Alert message={title} description={content} type="info" />
            </Spin>
          </Row>
          <div className="steps-action">
            <div>
              {current === 0 && !loading && (
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
        {activeUI}
      </div>
    );
  }
}
