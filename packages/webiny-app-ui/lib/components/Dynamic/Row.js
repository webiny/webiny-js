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

var Row = (function(_React$Component) {
    (0, _inherits3.default)(Row, _React$Component);

    function Row() {
        (0, _classCallCheck3.default)(this, Row);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Row.__proto__ || Object.getPrototypeOf(Row)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Row, [
        {
            key: "render",
            value: function render() {
                return this.props.children;
            }
        }
    ]);
    return Row;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(Row);
//# sourceMappingURL=Row.js.map
