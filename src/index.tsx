import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'mobx-react';

import * as serviceWorker from './serviceWorker';

import store from './stores';
import App from './components/App/ionic';
import Firebase, { FirebaseContext } from './components/Firebase';

ReactDOM.render(
  <Provider {...store}>
    <FirebaseContext.Provider value={new Firebase()}>
      <App />
    </FirebaseContext.Provider>
  </Provider>,
  document.getElementById('root'),
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
