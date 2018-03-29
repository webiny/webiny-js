"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _jquery = require("jquery");

var _jquery2 = _interopRequireDefault(_jquery);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Header = (function(_React$Component) {
    (0, _inherits3.default)(Header, _React$Component);

    function Header() {
        (0, _classCallCheck3.default)(this, Header);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Header.__proto__ || Object.getPrototypeOf(Header)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Header, [
        {
            key: "toggleMobile",
            value: function toggleMobile() {
                (0, _jquery2.default)("body").toggleClass("mobile-nav");
            }
        },
        {
            key: "render",
            value: function render() {
                var components = this.props.components;

                return _react2.default.createElement(
                    "div",
                    { className: "navbar navbar-inverse", role: "navigation" },
                    _react2.default.createElement(
                        "div",
                        { className: "navbar-header" },
                        _react2.default.createElement(
                            "button",
                            { type: "button", className: "nav", onClick: this.toggleMobile },
                            _react2.default.createElement("span", null),
                            _react2.default.createElement("span", null),
                            _react2.default.createElement("span", null)
                        ),
                        components.map(function(cmp, index) {
                            return (
                                cmp &&
                                _react2.default.cloneElement(
                                    (0, _react.isValidElement)(cmp)
                                        ? cmp
                                        : (0, _react.createElement)(cmp),
                                    {
                                        key: index
                                    }
                                )
                            );
                        })
                    )
                );
            }
        }
    ]);
    return Header;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(Header, {
    modules: [
        {
            components: function components() {
                return _webinyApp.app.modules.loadByTag("header-component").then(function(modules) {
                    return Object.values(modules).filter(function(m) {
                        return m;
                    });
                });
            }
        }
    ]
});
//# sourceMappingURL=Header.js.map
