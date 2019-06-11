/* eslint-disable global-require */
import React, { Fragment } from 'react';
import { render } from 'react-dom';
import { AppContainer as ReactHotAppContainer } from 'react-hot-loader';
import Root from './containers/Root';
import { configureStore, history } from './store/configureStore';
import './app.global.css';

const store = configureStore();

const AppContainer = process.env.PLAIN_HMR ? Fragment : ReactHotAppContainer;

render(
  <AppContainer>
    <Root store={store} history={history} />
  </AppContainer>,
  document.getElementById('root')
);

if (module.hot) {
  module.hot.accept('./containers/Root', () => {
    // eslint-disable-next-line global-require
    const NextRoot = require('./containers/Root').default;
    render(
      <AppContainer>
        <NextRoot store={store} history={history} />
      </AppContainer>,
      document.getElementById('root')
    );
  });
}

(function globalError() {
  /**
   * @param {String} errorMessage  错误信息
   * @param {String} scriptURI   出错的文件
   * @param {Long}  lineNumber   出错代码的行号
   * @param {Long}  columnNumber  出错代码的列号
   * @param {Object} errorObj    错误的详细信息，Anything
   */
  window.onerror = function(
    errorMessage,
    scriptURI,
    lineNumber,
    columnNumber,
    errorObj
  ) {
    const log = require('./utils/log').default.browserErrorLog();
    log.error('__START__');
    log.error('错误信息：', errorMessage);
    log.error('出错文件：', scriptURI);
    log.error('出错行号：', lineNumber);
    log.error('出错列号：', columnNumber);
    log.error('错误详情：', errorObj);
    log.error('__END__\n');
  };
})();
