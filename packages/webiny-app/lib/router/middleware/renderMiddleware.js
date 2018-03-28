"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

exports.default = function() {
    return (function() {
        var _ref = (0, _asyncToGenerator3.default)(
            /*#__PURE__*/ _regenerator2.default.mark(function _callee(params, next) {
                var route, match, resolve, component;
                return _regenerator2.default.wrap(
                    function _callee$(_context) {
                        while (1) {
                            switch ((_context.prev = _context.next)) {
                                case 0:
                                    (route = params.route),
                                        (match = params.match),
                                        (resolve = params.resolve);

                                    if (route.render) {
                                        params.output = route.render({
                                            route: route,
                                            match: match,
                                            resolve: resolve
                                        });
                                    }

                                    if (!route.component) {
                                        _context.next = 7;
                                        break;
                                    }

                                    _context.next = 5;
                                    return route.component();

                                case 5:
                                    component = _context.sent;

                                    params.output = _react2.default.createElement(component, {
                                        route: route,
                                        match: match,
                                        resolve: resolve
                                    });

                                case 7:
                                    if (typeof route.layout === "function") {
                                        params.output = route.layout(params.output);
                                    }

                                    next();

                                case 9:
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
//# sourceMappingURL=renderMiddleware.js.map
