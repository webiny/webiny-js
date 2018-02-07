import { services } from "webiny-api";

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
    return async ({ req }, next) => {
        const token =
            typeof options.token === "function" ? options.token(req) : req.get(options.token);
        if (!token) {
            return next();
        }
        req.identity = await services.get("Authentication").verifyToken(token);
        next();
    };
};
