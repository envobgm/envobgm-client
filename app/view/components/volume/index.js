/* eslint-disable react/default-props-match-prop-types,react/require-default-props */
import React from 'react';
import PropTypes from 'prop-types';
import { Icon, Slider } from 'antd';
import pp from './index.css';

const sliderStyle = {
  width: 50,
  margin: 0,
  marginLeft: 8
};

// 音量控制
const Index = ({ onChange, volume }) => (
  <div className={pp.Volume}>
    <Icon style={{ fontSize: 12 }} type="sound" />
    <Slider style={sliderStyle} value={volume} onChange={onChange} />
  </div>
);

Index.defaultProps = {
  volume: 0,
  onChange: () => {}
};

Index.propTypes = {
  volume: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired
};

export default Index;
