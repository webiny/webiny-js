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

var Body = (function(_React$Component) {
    (0, _inherits3.default)(Body, _React$Component);

    function Body() {
        (0, _classCallCheck3.default)(this, Body);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Body.__proto__ || Object.getPrototypeOf(Body)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Body, [
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var classes = (0, _classnames2.default)(
                    this.props.styles.body,
                    this.props.className
                );
                return _react2.default.createElement(
                    "div",
                    { style: this.props.style, className: classes },
                    this.props.children
                );
            }
        }
    ]);
    return Body;
})(_react2.default.Component);

Body.defaultProps = {
    style: null
};

exports.default = (0, _webinyApp.createComponent)(Body, { styles: _styles2.default });
//# sourceMappingURL=Body.js.map
