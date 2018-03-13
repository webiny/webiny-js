// @flow
import api from "webiny-api";
import { ApiErrorResponse } from "webiny-api";

/**
 * Authentication middleware factory.
 * @param options
 * @returns {Function} Request middleware function.
 */
export default (options: { token: Function | string }) => {
    /**
     * Authentication middleware.
     * Attempts to authenticate the client using the token from request (if any).
     * If successful, `identity` instance is set on the `req` object itself.
     * If not successful, we just call the next middleware.
     *
     * @param req
     * @param res
     * @param services
     * @param next
     * @return {Promise<void>}
     */
    return async (params: Object, next: Function, finish: Function) => {
        const { req } = params;
        const token =
            typeof options.token === "function" ? options.token(req) : req.get(options.token);
        if (!token) {
            return next();
        }

        try {
            req.identity = await api.serviceManager.get("Authentication").verifyToken(token);
        } catch (e) {
            return finish(new ApiErrorResponse(e.data, e.toString(), e.code, 401));
        }
        next();
    };
};
