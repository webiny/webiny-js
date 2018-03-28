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

var Panel = (function(_React$Component) {
    (0, _inherits3.default)(Panel, _React$Component);

    function Panel() {
        (0, _classCallCheck3.default)(this, Panel);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Panel.__proto__ || Object.getPrototypeOf(Panel)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Panel, [
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var classes = (0, _classnames2.default)(
                    this.props.styles.panel,
                    this.props.className
                );
                return _react2.default.createElement(
                    "div",
                    { className: classes },
                    this.props.children
                );
            }
        }
    ]);
    return Panel;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(Panel, { styles: _styles2.default });
//# sourceMappingURL=Panel.js.map
