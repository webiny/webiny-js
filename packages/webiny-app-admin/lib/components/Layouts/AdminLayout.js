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

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * AdminLayout is the main container that will hold all other components.
 * This component is the first one to render in the <body> element.
 */
var AdminLayout = (function(_React$Component) {
    (0, _inherits3.default)(AdminLayout, _React$Component);

    function AdminLayout() {
        (0, _classCallCheck3.default)(this, AdminLayout);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (AdminLayout.__proto__ || Object.getPrototypeOf(AdminLayout)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(AdminLayout, [
        {
            key: "render",
            value: function render() {
                var _props = this.props,
                    Navigation = _props.Navigation,
                    Header = _props.Header,
                    Footer = _props.Footer;

                return _react2.default.createElement(
                    "div",
                    { className: "master minimized" },
                    _react2.default.createElement(Header, null),
                    _react2.default.createElement(Navigation, null),
                    _react2.default.createElement(
                        "div",
                        { className: "master-content" },
                        _react2.default.createElement(
                            "div",
                            { className: "container-fluid" },
                            this.props.children
                        )
                    ),
                    _react2.default.createElement(Footer, null)
                );
            }
        }
    ]);
    return AdminLayout;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(AdminLayout, {
    modules: [
        {
            Header: "Skeleton.Header",
            Navigation: "Skeleton.Navigation",
            Footer: "Skeleton.Footer"
        }
    ]
});
//# sourceMappingURL=AdminLayout.js.map
