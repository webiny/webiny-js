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

var _styles = require("./../styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var InfoMessage = (function(_React$Component) {
    (0, _inherits3.default)(InfoMessage, _React$Component);

    function InfoMessage() {
        (0, _classCallCheck3.default)(this, InfoMessage);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (InfoMessage.__proto__ || Object.getPrototypeOf(InfoMessage)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(InfoMessage, [
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                return _react2.default.createElement(
                    "span",
                    { className: _styles2.default.infoMessage },
                    this.props.children
                );
            }
        }
    ]);
    return InfoMessage;
})(_react2.default.Component);

exports.default = InfoMessage;
//# sourceMappingURL=InfoMessage.js.map
