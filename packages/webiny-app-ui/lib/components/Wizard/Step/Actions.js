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

var _Next = require("./Actions/Next");

var _Next2 = _interopRequireDefault(_Next);

var _Previous = require("./Actions/Previous");

var _Previous2 = _interopRequireDefault(_Previous);

var _Action = require("./Actions/Action");

var _Action2 = _interopRequireDefault(_Action);

var _Finish = require("./Actions/Finish");

var _Finish2 = _interopRequireDefault(_Finish);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Actions = (function(_React$Component) {
    (0, _inherits3.default)(Actions, _React$Component);

    function Actions() {
        (0, _classCallCheck3.default)(this, Actions);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Actions.__proto__ || Object.getPrototypeOf(Actions)).apply(this, arguments)
        );
    }

    return Actions;
})(_react2.default.Component);

Actions.Next = _Next2.default;
Actions.Previous = _Previous2.default;
Actions.Action = _Action2.default;
Actions.Finish = _Finish2.default;

exports.default = Actions;
//# sourceMappingURL=Actions.js.map
