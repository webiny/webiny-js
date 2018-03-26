// @flow
import { app } from "webiny-client";

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
            params.route.identity = await app.services.get("authentication").authenticate();
        } catch (e) {
            if (typeof options.onNotAuthenticated === "function") {
                return await options.onNotAuthenticated(params, next, finish);
            }
        }
        next();
    };
};
