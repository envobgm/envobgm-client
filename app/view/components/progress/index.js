// @flow
import React from 'react';
import PropTypes from 'prop-types';
import { Progress } from 'antd';
import pp from './index.css';

// 进度条
const ProgressX = ({ process }) => (
  <div className={pp.Progress}>
    <Progress
      defaultValue={0}
      status="active"
      percent={process}
      showInfo={false}
    />
  </div>
);

ProgressX.defaultProps = {
  process: 0
};

ProgressX.propTypes = {
  process: PropTypes.number
};

export default ProgressX;
