"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _api = require("./api");

var _api2 = _interopRequireDefault(_api);

var _pageRenderer = require("./pageRenderer");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

exports.default = function() {
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    // Define handle function to check if this middleware needs to process the matched route
    var handle =
        config.handle ||
        function(_ref) {
            var route = _ref.route;
            return route.path === "*";
        };

    // Create page renderer
    var renderPage = (0, _pageRenderer.createRenderer)(config);

    // CMS middleware
    return (function() {
        var _ref2 = (0, _asyncToGenerator3.default)(
            /*#__PURE__*/ _regenerator2.default.mark(function _callee3(params, next, finish) {
                var match;
                return _regenerator2.default.wrap(
                    function _callee3$(_context3) {
                        while (1) {
                            switch ((_context3.prev = _context3.next)) {
                                case 0:
                                    match = params.match;

                                    if (!handle(params)) {
                                        _context3.next = 3;
                                        break;
                                    }

                                    return _context3.abrupt(
                                        "return",
                                        _api2.default
                                            .loadPage(match.url)
                                            .then(
                                                (function() {
                                                    var _ref3 = (0, _asyncToGenerator3.default)(
                                                        /*#__PURE__*/ _regenerator2.default.mark(
                                                            function _callee(data) {
                                                                return _regenerator2.default.wrap(
                                                                    function _callee$(_context) {
                                                                        while (1) {
                                                                            switch (
                                                                                (_context.prev =
                                                                                    _context.next)
                                                                            ) {
                                                                                case 0:
                                                                                    _context.next = 2;
                                                                                    return renderPage(
                                                                                        data
                                                                                    );

                                                                                case 2:
                                                                                    params.output =
                                                                                        _context.sent;

                                                                                    finish(params);

                                                                                case 4:
                                                                                case "end":
                                                                                    return _context.stop();
                                                                            }
                                                                        }
                                                                    },
                                                                    _callee,
                                                                    undefined
                                                                );
                                                            }
                                                        )
                                                    );

                                                    return function(_x5) {
                                                        return _ref3.apply(this, arguments);
                                                    };
                                                })()
                                            )
                                            .catch(function() {
                                                next();
                                            })
                                    );

                                case 3:
                                    if (!match.params.revision) {
                                        _context3.next = 5;
                                        break;
                                    }

                                    return _context3.abrupt(
                                        "return",
                                        _api2.default.loadPageRevision(match.params.revision).then(
                                            (function() {
                                                var _ref4 = (0, _asyncToGenerator3.default)(
                                                    /*#__PURE__*/ _regenerator2.default.mark(
                                                        function _callee2(data) {
                                                            return _regenerator2.default.wrap(
                                                                function _callee2$(_context2) {
                                                                    while (1) {
                                                                        switch (
                                                                            (_context2.prev =
                                                                                _context2.next)
                                                                        ) {
                                                                            case 0:
                                                                                _context2.next = 2;
                                                                                return renderPage(
                                                                                    data
                                                                                );

                                                                            case 2:
                                                                                params.output =
                                                                                    _context2.sent;

                                                                                finish(params);

                                                                            case 4:
                                                                            case "end":
                                                                                return _context2.stop();
                                                                        }
                                                                    }
                                                                },
                                                                _callee2,
                                                                undefined
                                                            );
                                                        }
                                                    )
                                                );

                                                return function(_x6) {
                                                    return _ref4.apply(this, arguments);
                                                };
                                            })()
                                        )
                                    );

                                case 5:
                                    next();

                                case 6:
                                case "end":
                                    return _context3.stop();
                            }
                        }
                    },
                    _callee3,
                    undefined
                );
            })
        );

        return function(_x2, _x3, _x4) {
            return _ref2.apply(this, arguments);
        };
    })();
};
//# sourceMappingURL=routerMiddleware.js.map
