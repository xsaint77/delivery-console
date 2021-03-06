import { push } from 'connected-react-router';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import {
  authenticationFailed,
  logUserIn,
  logUserOut,
  userProfileReceived,
} from 'console/state/auth/actions';
import { getAccessToken } from 'console/state/auth/selectors';
import { CHECK_AUTH_EXPIRY_INTERVAL_SECONDS } from 'console/settings';
import { parseHash, checkSession } from 'console/utils/auth0';
import { getCurrentPathname } from 'console/state/router/selectors';

@connect(
  (state, props) => ({
    accessToken: getAccessToken(state),
    pathname: getCurrentPathname(state),
  }),
  {
    authenticationFailed,
    logUserIn,
    logUserOut,
    userProfileReceived,
    push,
  },
)
export default class QueryAuth0 extends React.PureComponent {
  static propTypes = {
    accessToken: PropTypes.string,
    authenticationFailed: PropTypes.func.isRequired,
    logUserIn: PropTypes.func.isRequired,
    logUserOut: PropTypes.func.isRequired,
    pathname: PropTypes.string.isRequired,
    push: PropTypes.func.isRequired,
    userProfileReceived: PropTypes.func.isRequired,
  };

  async componentDidMount() {
    const { authenticationFailed } = this.props;
    let authResult;

    try {
      authResult = await parseHash();
    } catch (err) {
      authenticationFailed(err);
    }

    // By default this is true if the window.location.hash parsing stuff worked.
    // We might change our minds about this later.
    let startAccessTokenRefreshLoop = !!authResult;

    if (!authResult) {
      // It if was null from finishAuthenticationFlow() it means it didn't pick anything
      // up from the window.location.hash so we can potentially use what was stored in
      // localStorage.
      authResult = JSON.parse(localStorage.getItem('authResult'));
      if (authResult) {
        // If you have previously logged in we'll want to start the accessToken refresh
        // loop. Even if it has expired. Because, if it indeed as expired, the
        // accessToken refresh loop can silently authenticate you again.
        startAccessTokenRefreshLoop = true;
      }
      // But this is only good enough if it hasn't expired.
      const expiresAt = JSON.parse(localStorage.getItem('expiresAt'));
      if (expiresAt && expiresAt - new Date().getTime() < 0) {
        // Oh no! It has expired.
        authResult = null;
      }
    }

    if (authResult) {
      // This is only true if you arrived on the site with a valid window.location.hash
      // or the localStorage.authResult (and localStorage.expiresAt) wasn't out of date.
      this.postProcessAuthResult(authResult);
    }
    if (startAccessTokenRefreshLoop) {
      // Start a never-ending loop of periodically checking if the accessToken is about to
      // or has expired.
      // This only happens for users who have successfully logged in or have successfully
      // logged in the *past* but expired.
      await this.accessTokenRefreshLoop();
    }
  }

  postProcessAuthResult = authResult => {
    const { logUserIn, userProfileReceived } = this.props;
    const { state } = authResult;
    logUserIn(authResult);
    // Since we include 'id_token' for the 'responseType' in auth0.WebAuth
    // the authresult will contain the user profile as .idTokenPayload
    // included with the accessToken. Use this now to update the state so that we
    // can display the name and avatar you logged in as.
    userProfileReceived(authResult.idTokenPayload);

    if (state) {
      this.props.push(state);
    }
  };

  async accessTokenRefreshLoop() {
    if (!localStorage.getItem('expiresAt')) {
      // The user has logged out probably. Either way, no point bothering to refresh.
      return;
    }
    const expiresAt = JSON.parse(localStorage.getItem('expiresAt'));
    const expiresIn = expiresAt - new Date().getTime();
    const shouldRefresh = expiresIn <= CHECK_AUTH_EXPIRY_INTERVAL_SECONDS;

    const accessTokenRefreshLoopTimer = window.setTimeout(async () => {
      await this.accessTokenRefreshLoop();
    }, CHECK_AUTH_EXPIRY_INTERVAL_SECONDS * 1000);

    if (shouldRefresh) {
      // Time to refresh!
      console.info('Refreshing the auth0 access token.');
      try {
        const authResult = await checkSession(this.props.pathname);
        this.postProcessAuthResult(authResult);
      } catch (err) {
        window.clearTimeout(accessTokenRefreshLoopTimer);
        if (err && ['timeout', 'login_required'].includes(err.error)) {
          // Plain and simple, the silent authentication could not be done because the
          // single-sign-in wants to revisit.
          // If this check was done after the user successfully logged in thanks to
          // a still valid localStorage.expiresAt (and localStorage.accessToken) delete
          // those. If we don't do this, the user might think she's still logged in and
          // very soon will get a 401 on the next XHR request.
          this.props.logUserOut();
        } else {
          this.props.authenticationFailed(err);
        }
      }
    }
  }

  render() {
    return null;
  }
}
