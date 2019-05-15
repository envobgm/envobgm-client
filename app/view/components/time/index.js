/* eslint-disable no-param-reassign,react/prop-types,class-methods-use-this,react/default-props-match-prop-types */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import pp from './index.css';

// 播放计时
class Index extends Component {
  toTimeString(secs) {
    if (typeof secs !== 'number') {
      secs = 0;
    }

    secs = Math.round(secs);
    const minutes = Math.floor(secs / 60) || 0;
    const seconds = secs - minutes * 60 || 0;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  render() {
    let { secs, format } = this.props;
    if (typeof secs !== 'number') secs = 0;
    if (typeof format !== 'string') format = 'mm:ss';
    return (
      <div className={pp.Time}>
        {format === 'mm:ss' ? this.toTimeString(secs || 0) : null}
      </div>
    );
  }
}

Index.defaultProps = {
  secs: null,
  format: 'mm:ss'
};

Index.propTypes = {
  // secs: PropTypes.number,
  format: PropTypes.string
};

export default Index;
