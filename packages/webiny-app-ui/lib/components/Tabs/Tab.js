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

var _noop2 = require("lodash/noop");

var _noop3 = _interopRequireDefault(_noop2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * Skeleton class for possible future upgrades
 */
var Tab = (function(_React$Component) {
    (0, _inherits3.default)(Tab, _React$Component);

    function Tab() {
        (0, _classCallCheck3.default)(this, Tab);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Tab.__proto__ || Object.getPrototypeOf(Tab)).apply(this, arguments)
        );
    }

    return Tab;
})(_react2.default.Component);

Tab.defaultProps = {
    onClick: _noop3.default
};

exports.default = (0, _webinyApp.createComponent)(Tab, { tab: true });
//# sourceMappingURL=Tab.js.map
