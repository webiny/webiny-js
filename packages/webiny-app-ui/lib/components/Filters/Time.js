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

var Time = (function(_React$Component) {
    (0, _inherits3.default)(Time, _React$Component);

    function Time() {
        (0, _classCallCheck3.default)(this, Time);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Time.__proto__ || Object.getPrototypeOf(Time)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Time, [
        {
            key: "render",
            value: function render() {
                try {
                    return _react2.default.createElement(
                        "span",
                        null,
                        _webinyApp.i18n.time(this.props.value, this.props.format)
                    );
                } catch (e) {
                    return this.props.default;
                }
            }
        }
    ]);
    return Time;
})(_react2.default.Component);

Time.defaultProps = {
    format: null,
    default: "-",
    value: null
};

exports.default = (0, _webinyApp.createComponent)(Time);
//# sourceMappingURL=Time.js.map
