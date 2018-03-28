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

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _webinyApp = require("webiny-app");

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

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
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var _props = this.props,
                    Icon = _props.Icon,
                    icon = _props.icon,
                    styles = _props.styles,
                    className = _props.className,
                    style = _props.style,
                    children = _props.children,
                    title = _props.title;

                var classes = (0, _classnames2.default)(styles.header, className);
                return _react2.default.createElement(
                    "div",
                    { className: classes, style: style || null },
                    icon
                        ? _react2.default.createElement(
                              "div",
                              { className: styles.ico },
                              _react2.default.createElement(Icon, { icon: icon })
                          )
                        : null,
                    _react2.default.createElement("h3", null, title),
                    children
                );
            }
        }
    ]);
    return Header;
})(_react2.default.Component);

Header.defaultProps = {
    icon: null,
    style: null,
    title: null
};

exports.default = (0, _webinyApp.createComponent)(Header, {
    styles: _styles2.default,
    modules: ["Icon"]
});
//# sourceMappingURL=Header.js.map
