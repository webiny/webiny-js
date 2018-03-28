// @flow
import cookies from "js-cookie";
import _ from "lodash";
import axios from "axios";
import debugFactory from "debug";
import invariant from "invariant";
import type { AuthenticationServiceConfig } from "../../types";
import AuthenticationError from "./AuthenticationError";

const debug = debugFactory("webiny-app-security");

function getToken() {
    return cookies.get(this.config.cookie);
}

class Authentication {
    identity: null | Object;
    callbacks: { [event: string]: Array<Function> };
    config: AuthenticationServiceConfig;

    constructor(config: Object) {
        const defaultConfig = {
            header: "Authorization",
            cookie: "webiny-token",
            url: "/security/auth/me",
            fields:
                "id,email,firstName,lastName,roles.slug,roleGroups[id,name,roles.slug],gravatar",
            me: () => {
                return axios.create({
                    method: "get",
                    url: this.config.url,
                    params: { _fields: this.config.fields }
                });
            },
            onLogout: () => {
                // Override to do something
            }
        };
        this.config = { ...defaultConfig, ...config };
        this.callbacks = {
            onIdentity: [
                identity => {
                    if (identity) {
                        axios.defaults.headers[this.config.header] = getToken.call(this);
                    } else {
                        delete axios.defaults.headers[this.config.header];
                    }
                }
            ]
        };
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
            const response = await axios.post(strategyConfig.apiMethod, payload);
            const { message, code, data } = response.data;
            if (code) {
                return Promise.reject(new AuthenticationError(message, code, { response }));
            }

            // If token is not found in the response - resolve using the loaded data
            // without triggering authentication (this is possible in cases like 2FactorAuth, etc.)
            if (!data.token) {
                return Promise.resolve(data);
            }

            // Set token cookie
            const expires = new Date(data.expiresOn * 1000);
            cookies.set(this.config.cookie, data.token, { path: "/", expires });

            await this.authenticate();

            return Promise.resolve({ token: data.token, identity: this.identity });
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
            return Promise.reject(
                new AuthenticationError("Identity token is not set!", "TOKEN_NOT_SET")
            );
        }

        const { data: { code, message, data } } = await this.config.me().request({
            headers: { [this.config.header]: token }
        });

        if (code) {
            return Promise.reject(new AuthenticationError(message, code, data));
        }

        this.identity = data;
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
        await this.config.onLogout();
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

export default Authentication;
