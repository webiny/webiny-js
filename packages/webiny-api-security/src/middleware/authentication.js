// @flow
import { app } from "webiny-api";

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
    return async (params: Object, next: Function) => {
        const { req } = params;
        const token =
            typeof options.token === "function" ? options.token(req) : req.get(options.token);
        if (!token) {
            return next();
        }

        req.identity = await app.services.get("authentication").verifyToken(token);
        next();
    };
};
