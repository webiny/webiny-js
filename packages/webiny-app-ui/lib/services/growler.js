"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _assign2 = require("lodash/assign");

var _assign3 = _interopRequireDefault(_assign2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _reactDom = require("react-dom");

var _reactDom2 = _interopRequireDefault(_reactDom);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

// These will be lazy loaded when first growl is performed
var GrowlComponents = null;
var GrowlContainer = null;

function getGrowler() {
    if (!GrowlContainer) {
        document.body.appendChild(document.createElement("webiny-growler"));
        return new Promise(function(resolve) {
            var growlContainer = _react2.default.createElement(
                _webinyApp.LazyLoad,
                { modules: ["Growl"] },
                function(_ref) {
                    var Growl = _ref.Growl;

                    GrowlComponents = Growl;
                    return _react2.default.createElement(GrowlComponents.Container, {
                        onComponentDidMount: function onComponentDidMount(ref) {
                            GrowlContainer = ref;
                            resolve(GrowlContainer);
                        }
                    });
                }
            );
            _reactDom2.default.render(growlContainer, document.querySelector("webiny-growler"));
        });
    }

    return Promise.resolve(GrowlContainer);
}

function Growler(component) {
    return getGrowler().then(function(growler) {
        return growler.addGrowl(component);
    });
}

(0, _assign3.default)(Growler, {
    remove: (function() {
        var _ref2 = (0, _asyncToGenerator3.default)(
            /*#__PURE__*/ _regenerator2.default.mark(function _callee(growlId) {
                var growler;
                return _regenerator2.default.wrap(
                    function _callee$(_context) {
                        while (1) {
                            switch ((_context.prev = _context.next)) {
                                case 0:
                                    _context.next = 2;
                                    return getGrowler();

                                case 2:
                                    growler = _context.sent;

                                    if (growler) {
                                        _context.next = 5;
                                        break;
                                    }

                                    return _context.abrupt("return", null);

                                case 5:
                                    growler.removeById(growlId);

                                case 6:
                                case "end":
                                    return _context.stop();
                            }
                        }
                    },
                    _callee,
                    this
                );
            })
        );

        function remove(_x) {
            return _ref2.apply(this, arguments);
        }

        return remove;
    })(),
    info: (function() {
        var _ref3 = (0, _asyncToGenerator3.default)(
            /*#__PURE__*/ _regenerator2.default.mark(function _callee2(message) {
                var title =
                    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "Info";
                var sticky =
                    arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
                var ttl = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 3000;
                var growler;
                return _regenerator2.default.wrap(
                    function _callee2$(_context2) {
                        while (1) {
                            switch ((_context2.prev = _context2.next)) {
                                case 0:
                                    _context2.next = 2;
                                    return getGrowler();

                                case 2:
                                    growler = _context2.sent;

                                    if (growler) {
                                        _context2.next = 5;
                                        break;
                                    }

                                    return _context2.abrupt("return", null);

                                case 5:
                                    return _context2.abrupt(
                                        "return",
                                        growler.addGrowl(
                                            _react2.default.createElement(GrowlComponents.Info, {
                                                message: message,
                                                title: title,
                                                sticky: sticky,
                                                ttl: ttl
                                            })
                                        )
                                    );

                                case 6:
                                case "end":
                                    return _context2.stop();
                            }
                        }
                    },
                    _callee2,
                    this
                );
            })
        );

        function info(_x5) {
            return _ref3.apply(this, arguments);
        }

        return info;
    })(),
    success: (function() {
        var _ref4 = (0, _asyncToGenerator3.default)(
            /*#__PURE__*/ _regenerator2.default.mark(function _callee3(message) {
                var title =
                    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "Success";
                var sticky =
                    arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
                var ttl = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 3000;
                var growler;
                return _regenerator2.default.wrap(
                    function _callee3$(_context3) {
                        while (1) {
                            switch ((_context3.prev = _context3.next)) {
                                case 0:
                                    _context3.next = 2;
                                    return getGrowler();

                                case 2:
                                    growler = _context3.sent;

                                    if (growler) {
                                        _context3.next = 5;
                                        break;
                                    }

                                    return _context3.abrupt("return", null);

                                case 5:
                                    return _context3.abrupt(
                                        "return",
                                        growler.addGrowl(
                                            _react2.default.createElement(GrowlComponents.Success, {
                                                message: message,
                                                title: title,
                                                sticky: sticky,
                                                ttl: ttl
                                            })
                                        )
                                    );

                                case 6:
                                case "end":
                                    return _context3.stop();
                            }
                        }
                    },
                    _callee3,
                    this
                );
            })
        );

        function success(_x9) {
            return _ref4.apply(this, arguments);
        }

        return success;
    })(),
    danger: (function() {
        var _ref5 = (0, _asyncToGenerator3.default)(
            /*#__PURE__*/ _regenerator2.default.mark(function _callee4(message) {
                var title =
                    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "Danger";
                var sticky =
                    arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
                var ttl = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 3000;
                var growler;
                return _regenerator2.default.wrap(
                    function _callee4$(_context4) {
                        while (1) {
                            switch ((_context4.prev = _context4.next)) {
                                case 0:
                                    _context4.next = 2;
                                    return getGrowler();

                                case 2:
                                    growler = _context4.sent;

                                    if (growler) {
                                        _context4.next = 5;
                                        break;
                                    }

                                    return _context4.abrupt("return", null);

                                case 5:
                                    return _context4.abrupt(
                                        "return",
                                        growler.addGrowl(
                                            _react2.default.createElement(GrowlComponents.Danger, {
                                                message: message,
                                                title: title,
                                                sticky: sticky,
                                                ttl: ttl
                                            })
                                        )
                                    );

                                case 6:
                                case "end":
                                    return _context4.stop();
                            }
                        }
                    },
                    _callee4,
                    this
                );
            })
        );

        function danger(_x13) {
            return _ref5.apply(this, arguments);
        }

        return danger;
    })(),
    warning: (function() {
        var _ref6 = (0, _asyncToGenerator3.default)(
            /*#__PURE__*/ _regenerator2.default.mark(function _callee5(message) {
                var title =
                    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "Warning";
                var sticky =
                    arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
                var ttl = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 3000;
                var growler;
                return _regenerator2.default.wrap(
                    function _callee5$(_context5) {
                        while (1) {
                            switch ((_context5.prev = _context5.next)) {
                                case 0:
                                    _context5.next = 2;
                                    return getGrowler();

                                case 2:
                                    growler = _context5.sent;

                                    if (growler) {
                                        _context5.next = 5;
                                        break;
                                    }

                                    return _context5.abrupt("return", null);

                                case 5:
                                    return _context5.abrupt(
                                        "return",
                                        growler.addGrowl(
                                            _react2.default.createElement(GrowlComponents.Warning, {
                                                message: message,
                                                title: title,
                                                sticky: sticky,
                                                ttl: ttl
                                            })
                                        )
                                    );

                                case 6:
                                case "end":
                                    return _context5.stop();
                            }
                        }
                    },
                    _callee5,
                    this
                );
            })
        );

        function warning(_x17) {
            return _ref6.apply(this, arguments);
        }

        return warning;
    })()
});

exports.default = Growler;
//# sourceMappingURL=growler.js.map
