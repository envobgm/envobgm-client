// @flow
import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from 'antd';

// 开关控制
const Switch = ({ open, onSwitch, keyDown }) => (
  <div
    tabIndex="0"
    aria-checked
    role="switch"
    onClick={onSwitch}
    onKeyDown={keyDown}
  >
    <Icon
      type={open ? 'pause' : 'caret-right'}
      style={{ fontSize: 24, color: 'rgb(178, 170, 157)' }}
    />
  </div>
);

Switch.propTypes = {
  open: PropTypes.bool,
  onSwitch: PropTypes.func,
  keyDown: PropTypes.func
};

Switch.defaultProps = {
  open: false,
  onSwitch() {},
  keyDown() {}
};

export default Switch;
