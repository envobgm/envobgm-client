// @flow
import React from 'react';
import PropTypes from 'prop-types';
import { Progress as AntdProgress } from 'antd';
import pp from './index.css';

// 进度条
const Progress = ({ process }) => (
  <div className={pp.Progress}>
    <AntdProgress
      defaultValue={0}
      status="active"
      percent={process}
      showInfo={false}
    />
  </div>
);

Progress.propTypes = {
  process: PropTypes.number
};

Progress.defaultProps = {
  process: 0
};

export default Progress;
