// @flow
import { app } from "webiny-app";
import debug from "debug";

const log = debug("webiny-app-security");

/**
 * Authentication middleware factory.
 * @param options
 * @returns {Function} Request middleware function.
 */
export default (options: { onNotAuthenticated: Function }) => {
    /**
     * Authentication middleware.
     * Attempts to authenticate the user using `authentication` service.
     * If successful, `identity` instance is set on the `route` object.
     * If not successful, `onNotAuthenticated` callback is called to decide what to do.
     *
     * @param params
     * @param next
     * @param finish
     * @return {Promise<void>}
     */
    return async (params: Object, next: Function, finish: Function) => {
        try {
            params.route.identity = await app.security.authenticate();
        } catch (e) {
            if (e.name === "AuthenticationError") {
                log(`${e.name}: ${e.message}`);
            } else {
                console.error(e);
            }

            if (typeof options.onNotAuthenticated === "function") {
                return await options.onNotAuthenticated(params, next, finish);
            }
        }
        next();
    };
};
