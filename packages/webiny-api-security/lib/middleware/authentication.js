"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _webinyApi = require("webiny-api");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * Authentication middleware factory.
 * @param options
 * @returns {Function} Request middleware function.
 */
exports.default = options => {
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
    return (() => {
        var _ref = (0, _asyncToGenerator3.default)(function*(params, next, finish) {
            const { req } = params;
            const token =
                typeof options.token === "function" ? options.token(req) : req.get(options.token);
            if (!token) {
                return next();
            }

            try {
                req.identity = yield _webinyApi.app.services
                    .get("authentication")
                    .verifyToken(token);
            } catch (e) {
                return finish(new _webinyApi.ApiErrorResponse(e.data, e.toString(), e.code, 401));
            }
            next();
        });

        return function(_x, _x2, _x3) {
            return _ref.apply(this, arguments);
        };
    })();
};
//# sourceMappingURL=authentication.js.map
