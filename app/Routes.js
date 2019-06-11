import React from 'react';
import { Switch, Route, Redirect } from 'react-router';
import routes from './constants/routes';
import App from './containers/App';
import { getUrlParam } from './utils/custUtil';
import HomePage from './components/index';
import ActivePage from './components/active';
import ControlPanelPage from './components/controlPanel';

function redirectPath() {
  const page = getUrlParam('page');
  if (page === 'controlPanel') {
    return routes.CONTROL_PANEL;
  }
  return routes.HOME;
}

export default () => (
  <App>
    <Switch>
      <Route exact path={routes.ACTIVE} component={ActivePage} />
      <Route exact path={routes.HOME} component={HomePage} />
      <Route exact path={routes.CONTROL_PANEL} component={ControlPanelPage} />
      <Redirect path="/" to={redirectPath()} />
    </Switch>
  </App>
);
