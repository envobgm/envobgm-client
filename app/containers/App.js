// @flow
import * as React from 'react';
import Socket from '../utils/socket';

type Props = {
  children: React.Node
};

export default class App extends React.Component<Props> {
  props: Props;

  async componentDidMount() {
    window.socket = await Socket.getInstance();
  }

  render() {
    const { children } = this.props;
    return <React.Fragment>{children}</React.Fragment>;
  }
}
