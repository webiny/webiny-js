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

var _omit2 = require("lodash/omit");

var _omit3 = _interopRequireDefault(_omit2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _Growl = require("./Growl");

var _Growl2 = _interopRequireDefault(_Growl);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var WarningGrowl = (function(_React$Component) {
    (0, _inherits3.default)(WarningGrowl, _React$Component);

    function WarningGrowl() {
        (0, _classCallCheck3.default)(this, WarningGrowl);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (WarningGrowl.__proto__ || Object.getPrototypeOf(WarningGrowl)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(WarningGrowl, [
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                return _react2.default.createElement(
                    _Growl2.default,
                    (0, _omit3.default)(this.props, ["render"])
                );
            }
        }
    ]);
    return WarningGrowl;
})(_react2.default.Component);

WarningGrowl.defaultProps = {
    title: null,
    ttl: 3000,
    sticky: false,
    message: null,
    type: "warning"
};

exports.default = (0, _webinyApp.createComponent)(WarningGrowl);
//# sourceMappingURL=WarningGrowl.js.map
