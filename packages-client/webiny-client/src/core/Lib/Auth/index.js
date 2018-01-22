import React from "react";
import _ from "lodash";
import { Webiny } from "./../../../index";

class Auth {
    constructor() {
        this.loginRoute = "Login";
        this.forbiddenRoute = "Forbidden";
        this.routerEvent = null;
    }

    init() {
        Webiny.Router.addRoute(
            new Webiny.Route(this.loginRoute, "/login", this.renderLogin(), "Login").setLayout(
                "empty"
            )
        );
        Webiny.Router.addRoute(
            new Webiny.Route(this.forbiddenRoute, "/forbidden", this.renderForbidden(), "Forbidden")
        );

        Webiny.Router.onBeforeStart(routerEvent => {
            Webiny.Http.addRequestInterceptor(http => {
                http.addHeader("X-Webiny-Authorization", Webiny.Cookies.get(this.getCookieName()));
            });

            // Watch if we got a forbidden request - then log out
            Webiny.Http.addResponseInterceptor(this.getResponseInterceptor());

            return this.checkUser(routerEvent);
        });
        Webiny.Router.onRouteWillChange(this.checkUser.bind(this));
    }

    getResponseInterceptor() {
        return response => {
            if (response.getStatus() === 403) {
                this.onForbidden(response);
            }
        };
    }

    /**
     * Check if user is authenticated and authorized to visit requested route.
     * This method is the main "entry point" into the verification process.
     *
     * @param routerEvent
     * @returns {*}
     */
    checkUser(routerEvent) {
        this.routerEvent = routerEvent;

        if (Webiny.Model.get("User")) {
            return this.checkRouteRole(routerEvent);
        }

        const token = Webiny.Cookies.get(this.getCookieName());

        // Check if token exists on client side
        if (!token) {
            return this.onNoToken(routerEvent);
        }

        // Try fetching user data
        return this.getUser().then(() => this.checkRouteRole(routerEvent));
    }

    checkRouteRole(routerEvent) {
        if (_.has(routerEvent.route, "role")) {
            return new Promise(resolve => {
                const user = Webiny.Model.get("User");

                if (
                    user &&
                    _.isArray(routerEvent.route.role) &&
                    this.hasRole(routerEvent.route.role)
                ) {
                    return resolve(routerEvent);
                }

                if (user && _.isFunction(routerEvent.route.role)) {
                    return Promise.resolve(routerEvent.route.role(routerEvent.route)).then(
                        allowed => {
                            if (!allowed) {
                                routerEvent.stop();
                                routerEvent.goToRoute(this.forbiddenRoute);
                            }
                            resolve(routerEvent);
                        }
                    );
                }

                routerEvent.stop();
                routerEvent.goToRoute(this.forbiddenRoute);
                resolve(routerEvent);
            });
        }
        return Promise.resolve(routerEvent);
    }

    /**
     * This method checks if current target route is already a login route and redirects (or not) properly.
     *
     * @param routerEvent
     * @returns {*}
     */
    goToLogin(routerEvent) {
        const isLoginRoute = _.get(routerEvent.route, "name") === this.loginRoute;

        if (!isLoginRoute) {
            Webiny.LocalStorage.set("loginRedirect", window.location.href);
            routerEvent.stop();
            routerEvent.goToRoute(this.loginRoute);
        }

        return routerEvent;
    }

    onNoToken(routerEvent) {
        return this.goToLogin(routerEvent);
    }

    /**
     * Use the given user data to check if the user is authorized to be in this app.
     * This logic is completely specific to your application. Implement this as you see fit.
     *
     * This method is used by `verifyUser` and Login forms to check authorization of logged in user.
     *
     * @param user
     * @returns {boolean}
     */
    isAuthorized(user) {
        if (_.find(user.roles, { slug: "administrator" })) {
            return true;
        }

        return !!_.find(user.roleGroups, rg => !!_.find(rg.roles, { slug: "administrator" }));
    }

    getUserFields() {
        return "*,roles.slug,roleGroups[id,name,roles.slug],gravatar";
    }

    /**
     * Fetch user profile and verify the returned data.
     *
     * @returns Promise
     */
    getUser() {
        return this.getApiEndpoint()
            .get("/me", { _fields: this.getUserFields() })
            .then(apiResponse => {
                return Promise.resolve(this.verifyUser(apiResponse)).then(() => apiResponse);
            });
    }

    /**
     * Get cookie name
     * @returns {string}
     */
    getCookieName() {
        return "webiny-token";
    }

    getApiEndpoint() {
        if (!this.authApi) {
            this.authApi = new Webiny.Api.Endpoint("/entities/webiny/users");
        }
        return this.authApi;
    }

    refresh() {
        return this.getUser();
    }

    logout(redirect = true) {
        let logout = Promise.resolve().then(() => {
            Webiny.Model.set("User", null);
            Webiny.Cookies.remove(this.getCookieName());
        });

        if (redirect) {
            logout = logout.then(() => Webiny.Router.goToRoute(this.loginRoute));
        }

        return logout;
    }

    /**
     * This method determines if the given response from the API is valid user data.
     * It also executes `isAuthorized` to see if given user is allowed to be in this app.
     *
     * This method can be overridden to suit your app's needs.
     * It is up to the developer to handle both `verified` and `unverified` cases as he sees fit.
     *
     * @param apiResponse
     * @returns {*}
     */
    verifyUser(apiResponse) {
        const data = apiResponse.getData();
        if (apiResponse.isError() || !this.isAuthorized(data)) {
            // We need to stop router event to prevent him from rendering the route he initially intended
            this.routerEvent && this.routerEvent.stop();
            return this.logout();
        }
        Webiny.Model.set("User", data);
    }

    /**
     * Check if current user has any of the requested roles (checks both roles and roleGroups)
     * @param role
     */
    hasRole(role) {
        if (_.isString(role)) {
            role = [role];
        }

        const user = Webiny.Model.get("User");
        // First check user roles
        let hasRole = _.find(user.roles, r => role.indexOf(r.slug) > -1);
        if (!hasRole) {
            // Check user role groups
            _.each(user.roleGroups, group => {
                hasRole = _.find(group.roles, r => role.indexOf(r.slug) > -1);
                if (hasRole) {
                    return false;
                }
            });
        }

        return hasRole;
    }

    /**
     * Triggered when user is not authorized to perform the HTTP request.
     */
    onForbidden(httpResponse) {
        // Implement whatever logic you see fit
    }

    renderLogin() {
        return null;
    }

    renderForbidden() {
        return null;
    }
}

export default Auth;
