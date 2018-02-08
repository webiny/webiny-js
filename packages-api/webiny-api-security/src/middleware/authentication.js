// @flow
import api from "webiny-api";

/**
 * Authentication middleware factory.
 * @param options
 * @returns {Function} Request middleware function.
 */
export default (options: { token: Function | string }) => {
    /**
     * Authentication middleware.
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
        req.identity = await api.serviceManager.get("Authentication").verifyToken(token);
        next();
    };
};
