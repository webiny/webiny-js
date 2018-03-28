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

exports.default = () => {
    /**
     * Authorization middleware.
     * Checks if request identity is authorized to execute the matched API method.
     *
     * @param {Object} params
     * @param {Request} params.req
     * @param {ApiMethod} params.apiMethod
     * @param {Api} params.app
     * @param next
     * @return {Promise<void>}
     */
    return (() => {
        var _ref = (0, _asyncToGenerator3.default)(function*(params, next) {
            const { req, matchedApiMethod } = params;
            yield _webinyApi.app.services
                .get("authorization")
                .canExecute(matchedApiMethod.getApiMethod(), req.identity);
            next();
        });

        return function(_x, _x2) {
            return _ref.apply(this, arguments);
        };
    })();
};
//# sourceMappingURL=authorization.js.map
