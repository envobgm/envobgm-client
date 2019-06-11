// @flow
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import pp from './index.css';

// const debug = require('debug')('time');

// 播放计时
class Time extends PureComponent {
  static toTimeString(secs) {
    const exaSecs = Math.round(secs);
    const minutes = Math.floor(exaSecs / 60) || 0;
    const seconds = exaSecs - minutes * 60 || 0;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  render() {
    let { secs, format } = this.props;
    if (typeof secs !== 'number') secs = 0;
    if (typeof format !== 'string') format = 'mm:ss';
    return (
      <div className={pp.Time}>
        {format === 'mm:ss' ? Time.toTimeString(secs || 0) : null}
      </div>
    );
  }
}

Time.propTypes = {
  secs: PropTypes.number,
  format: PropTypes.string
};

Time.defaultProps = {
  secs: 0,
  format: 'mm:ss'
};

export default Time;
