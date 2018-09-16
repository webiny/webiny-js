// @flow
import cookies from "js-cookie";
import _ from "lodash";
import debugFactory from "debug";
import invariant from "invariant";
import { app } from "webiny-app";
import gql from "graphql-tag";
import type { AuthenticationServiceConfig } from "../../types";
import SecurityError from "./SecurityError";

const debug = debugFactory("webiny-app-security");

function getToken() {
    return cookies.get(this.config.cookie);
}

class Security {
    identity: null | Object;
    callbacks: { [event: string]: Array<Function> };
    config: AuthenticationServiceConfig;

    configure(config: Object) {
        const defaultConfig = {
            header: "Authorization",
            cookie: "webiny-token",
            me: () => {
                const fields = config.identities.map(({ identity, fields }) => {
                    return `... on ${identity} {
                        ${fields}
                    }`;
                });

                return gql`
                    {
                        Me {
                          get {
                            ${fields.join("\\n")}  
                          }
                        }   
                    }`;
            },
            onLogout: () => {
                // Override to do something
            }
        };
        this.config = { ...defaultConfig, ...config };
        this.callbacks = {
            onIdentity: []
        };

        app.graphql.addRequestInterceptor(() => {
            const token = getToken.call(this);
            if (token) {
                return {
                    headers: {
                        [this.config.header]: "Bearer " + token
                    }
                };
            }

            return {};
        });
    }

    async login(identity: string, strategy: string, payload: Object): Promise<{}> {
        try {
            const identityConfig = _.find(this.config.identities, { identity });
            invariant(
                identityConfig,
                `Identity "${identity}" not found in authentication service!`
            );

            const strategyConfig = _.find(identityConfig.authenticate, { strategy });
            invariant(
                strategyConfig,
                `Strategy "${strategy}" not found in authentication service!`
            );

            // Attempt to login
            const { data, errors } = await app.graphql.query({
                query: strategyConfig.query,
                variables: payload
            });

            const me = _.get(data, "Security.Users.authenticate");

            if (errors) {
                const { message, code, data } = errors[0];
                return Promise.reject(new SecurityError(message, code, data));
            }

            // Set token cookie
            const expires = new Date(me.expiresOn * 1000);
            cookies.set(this.config.cookie, me.token, { path: "/", expires });

            this.identity = me.identity;
            const { id, email } = this.identity;
            debug(`Loaded user %o with id %o`, email, id);
            this.callbacks.onIdentity.map(cb => cb(this.identity));

            return Promise.resolve({ token: me.token, identity: this.identity });
        } catch (e) {
            return Promise.reject(e);
        }
    }

    /**
     * Authenticate user (if possible).
     * @returns {Promise<Object>} Identity data.
     */
    async authenticate(): Promise<?Object> {
        if (this.identity) {
            return Promise.resolve(this.identity);
        }

        const token = getToken.call(this);
        if (!token) {
            return Promise.reject(new SecurityError("Identity token is not set!", "TOKEN_NOT_SET"));
        }

        const { errors, data } = await app.graphql.query({
            query: this.config.me()
        });

        if (errors) {
            const { message, code, data } = errors[0];
            return Promise.reject(new SecurityError(message, code, data));
        }

        this.identity = data.Me.get;
        const { id, email } = this.identity;
        debug(`Loaded user %o with id %o`, email, id);
        this.callbacks.onIdentity.map(cb => cb(this.identity));

        return Promise.resolve(this.identity);
    }

    /**
     * Refresh user data by fetching fresh data via API.
     *
     * @returns {Promise<Object>}
     */
    refresh(): Promise<?Object> {
        this.identity = null;
        return this.authenticate();
    }

    async logout(): Promise<void> {
        this.identity = null;
        cookies.remove(this.config.cookie, { path: "/" });
        this.callbacks.onIdentity.map(cb => cb(null));
        this.config.onLogout && (await this.config.onLogout());
        return Promise.resolve();
    }

    /**
     * Add callback for when `identity` data is changed.
     * @param callback
     * @returns {Function} A function to remove the callback.
     */
    onIdentity(callback: Function): Function {
        const length = this.callbacks.onIdentity.push(callback);
        return () => this.callbacks.onIdentity.splice(length - 1, 1);
    }
}

export default Security;
