// @flow
/* eslint-disable no-unused-vars,jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions,prettier/prettier */
import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from 'antd';

const switchStyle = {
  textAlign: 'center',
  verticalAlign: '1rem',
  borderRadius: '50%',
  width: '45px',
  height: '45px',
  background: '#eeede8',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
};

// 开关控制
const Switch = ({ open, onSwitch }) => (
  <div onClick={onSwitch}>
    <Icon
      type={open ? 'pause' : 'caret-right'}
      style={{ fontSize: 24, color: 'rgb(178, 170, 157)' }}
    />
  </div>
);

Switch.defaultProps = {
  open: false,
  onSwitch: null
};

Switch.propTypes = {
  open: PropTypes.bool,
  onSwitch: PropTypes.func
};

export default Switch;
