"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * Authentication middleware factory.
 * @param options
 * @returns {Function} Request middleware function.
 */
exports.default = function(options) {
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
    return (function() {
        var _ref = (0, _asyncToGenerator3.default)(
            /*#__PURE__*/ _regenerator2.default.mark(function _callee(params, next, finish) {
                return _regenerator2.default.wrap(
                    function _callee$(_context) {
                        while (1) {
                            switch ((_context.prev = _context.next)) {
                                case 0:
                                    _context.prev = 0;
                                    _context.next = 3;
                                    return _webinyApp.app.services
                                        .get("authentication")
                                        .authenticate();

                                case 3:
                                    params.route.identity = _context.sent;
                                    _context.next = 12;
                                    break;

                                case 6:
                                    _context.prev = 6;
                                    _context.t0 = _context["catch"](0);

                                    if (!(typeof options.onNotAuthenticated === "function")) {
                                        _context.next = 12;
                                        break;
                                    }

                                    _context.next = 11;
                                    return options.onNotAuthenticated(params, next, finish);

                                case 11:
                                    return _context.abrupt("return", _context.sent);

                                case 12:
                                    next();

                                case 13:
                                case "end":
                                    return _context.stop();
                            }
                        }
                    },
                    _callee,
                    undefined,
                    [[0, 6]]
                );
            })
        );

        return function(_x, _x2, _x3) {
            return _ref.apply(this, arguments);
        };
    })();
};
//# sourceMappingURL=authentication.js.map
