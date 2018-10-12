import invariant from "invariant";
import _ from "lodash";
import SecurityError from "./SecurityError";
import cookies from "js-cookie";
import { apolloClient } from "webiny-app";

function getToken(config) {
    return cookies.get(config.cookie);
}

export default (config) => {
    const callbacks = {
        onIdentity: []
    };

    const security = {
        identity: null,
        async login(identity: string, strategy: string, payload: Object): Promise<{}> {
            try {
                const identityConfig = _.find(config.identities, { identity });
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
                const { data, errors } = await apolloClient.query({
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
                cookies.set(config.cookie, me.token, { path: "/", expires });

                this.identity = me.identity;
                callbacks.onIdentity.map(cb => cb(this.identity));

                return Promise.resolve({ token: me.token, identity: this.identity });
            } catch (e) {
                return Promise.reject(e);
            }
        },

        /**
         * Authenticate user (if possible).
         * @returns {Promise<Object>} Identity data.
         */
        async authenticate(): Promise<?Object> {
            if (this.identity) {
                return Promise.resolve(this.identity);
            }

            const token = getToken(config);
            if (!token) {
                return Promise.reject(
                    new SecurityError("Identity token is not set!", "TOKEN_NOT_SET")
                );
            }

            const { errors, data } = await apolloClient.query({
                query: config.me()
            });

            if (errors) {
                const { message, code, data } = errors[0];
                return Promise.reject(new SecurityError(message, code, data));
            }

            this.identity = data.Me.get;
            callbacks.onIdentity.map(cb => cb(this.identity));

            return Promise.resolve(this.identity);
        },
        /**
         * Refresh user data by fetching fresh data via API.
         *
         * @returns {Promise<Object>}
         */
        refresh(): Promise<?Object> {
            this.identity = null;
            return this.authenticate();
        },

        async logout(): Promise<void> {
            this.identity = null;
            cookies.remove(config.cookie, { path: "/" });
            callbacks.onIdentity.map(cb => cb(null));
            config.onLogout && (await config.onLogout());
            return Promise.resolve();
        },

        /**
         * Add callback for when `identity` data is changed.
         * @param callback
         * @returns {Function} A function to remove the callback.
         */
        onIdentity(callback: Function): Function {
            const length = callbacks.onIdentity.push(callback);
            return () => callbacks.onIdentity.splice(length - 1, 1);
        }
    };

    return security;
};
