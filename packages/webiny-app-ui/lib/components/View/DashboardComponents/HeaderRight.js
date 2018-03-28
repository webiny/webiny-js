"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _styles = require("./../styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var HeaderRight = (function(_React$Component) {
    (0, _inherits3.default)(HeaderRight, _React$Component);

    function HeaderRight() {
        (0, _classCallCheck3.default)(this, HeaderRight);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (HeaderRight.__proto__ || Object.getPrototypeOf(HeaderRight)).apply(this, arguments)
        );
    }

    return HeaderRight;
})(_react2.default.Component);

HeaderRight.defaultProps = {
    render: function render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        var styles = this.props.styles;

        return _react2.default.createElement(
            "div",
            { className: styles.dashboardHeaderRight },
            this.props.children
        );
    }
};

exports.default = (0, _webinyApp.createComponent)(HeaderRight, { styles: _styles2.default });
//# sourceMappingURL=HeaderRight.js.map
