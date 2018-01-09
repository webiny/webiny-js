/**
 * Skeleton Auth introduces some UX improvements.
 * We are allowed to mix in some UI into the Auth layer since this is an app which is tightly coupled with our built-in "admin" app layout.
 * It will open a login overlay when auth token has expired to keep you from navigation away from what you were doing.
 * Image typing an article and all of a sudden your token expires and there is no way to save it! Well - this serves exactly that purpose.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import {Webiny} from 'webiny-client';

import Forbidden from './../Views/Auth/Forbidden';
import Login from './../Views/Auth/Login';

let showLogin = false;
let showLoginBuffer = 0;

class Auth extends Webiny.Base.Auth {
    getResponseInterceptor() {
        return response => {
            if (response.getStatus() === 403) {
                this.onForbidden(response);
            }

            const activeRoute = Webiny.Router.getActiveRoute();
            const loginRoute = activeRoute && activeRoute.name === this.loginRoute;
            const userDataExists = Webiny.Model.get('User');
            if (response.getStatus() === 401 && response.getData('code') === 'WBY-AUTH-TOKEN-EXPIRED' && !loginRoute && userDataExists) {
                const now = new Date().getTime();
                // Do not show login form if it is already shown or if login was performed less then 10 seconds ago
                // This buffer is needed to prevent requests started before the new cookie was set from
                // opening the login modal right after a successful login
                if (showLogin || (now - showLoginBuffer) < 10000) {
                    return;
                }

                showLogin = true;
                response.data.message = 'Unfortunately we could not perform your latest action. You can retry as soon as you log in again.';

                if (!document.querySelector('login-overlay')) {
                    document.body.appendChild(document.createElement('login-overlay'));
                }

                const target = document.querySelector('login-overlay');
                const LoginView = this.renderLogin();

                if (LoginView) {
                    const props = {
                        overlay: true,
                        onSuccess: () => {
                            showLogin = false;
                            showLoginBuffer = new Date().getTime();
                            ReactDOM.unmountComponentAtNode(target);
                        }
                    };

                    const {createElement, cloneElement, isValidElement} = React;
                    const view = isValidElement(LoginView) ? cloneElement(LoginView, props) : createElement(LoginView, props);
                    ReactDOM.render(view, target);
                }
            }
        };
    }

    verifyUser(apiResponse) {
        const data = apiResponse.getData();
        if (apiResponse.isError() || !this.isAuthorized(data) && !showLogin) {
            this.routerEvent && this.routerEvent.stop();
            return this.logout();
        }
        Webiny.Model.set('User', data);
    }

    renderLogin() {
        return Login;
    }

    renderForbidden() {
        return Forbidden;
    }
}

export default Auth;