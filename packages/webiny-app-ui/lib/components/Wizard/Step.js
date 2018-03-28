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

var _Content = require("./Step/Content");

var _Content2 = _interopRequireDefault(_Content);

var _Actions = require("./Step/Actions");

var _Actions2 = _interopRequireDefault(_Actions);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Step = (function(_React$Component) {
    (0, _inherits3.default)(Step, _React$Component);

    function Step() {
        (0, _classCallCheck3.default)(this, Step);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Step.__proto__ || Object.getPrototypeOf(Step)).apply(this, arguments)
        );
    }

    return Step;
})(_react2.default.Component);

Step.defaultProps = {
    current: false,
    completed: false,
    title: null,
    name: null,
    onLeave: _noop3.default,
    onEnter: _noop3.default
};

Step.Content = _Content2.default;
Step.Actions = _Actions2.default;

exports.default = Step;
//# sourceMappingURL=Step.js.map
