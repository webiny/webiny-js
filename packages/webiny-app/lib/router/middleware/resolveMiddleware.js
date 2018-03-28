"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

exports.default = function() {
    return (function() {
        var _ref = (0, _asyncToGenerator3.default)(
            /*#__PURE__*/ _regenerator2.default.mark(function _callee(params, next) {
                var route;
                return _regenerator2.default.wrap(
                    function _callee$(_context) {
                        while (1) {
                            switch ((_context.prev = _context.next)) {
                                case 0:
                                    // Resolve middleware
                                    route = params.route;

                                    if (!route.resolve) {
                                        _context.next = 5;
                                        break;
                                    }

                                    _context.next = 4;
                                    return route.resolve({ route: route });

                                case 4:
                                    params.resolve = _context.sent;

                                case 5:
                                    next();

                                case 6:
                                case "end":
                                    return _context.stop();
                            }
                        }
                    },
                    _callee,
                    undefined
                );
            })
        );

        return function(_x, _x2) {
            return _ref.apply(this, arguments);
        };
    })();
};
//# sourceMappingURL=resolveMiddleware.js.map
