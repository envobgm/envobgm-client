import React from 'react';
import { Switch, Route } from 'react-router';
import routes from './constants/routes';
import App from './containers/App';
import HomePage from './view';
import ActivePage from './view/active';

export default () => (
  <App>
    <Switch>
      <Route path="/active" component={ActivePage} />
      <Route path={routes.HOME} component={HomePage} />
    </Switch>
  </App>
);
