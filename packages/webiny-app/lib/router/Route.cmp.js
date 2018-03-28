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

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Route = (function(_React$Component) {
    (0, _inherits3.default)(Route, _React$Component);

    function Route() {
        (0, _classCallCheck3.default)(this, Route);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Route.__proto__ || Object.getPrototypeOf(Route)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Route, [
        {
            key: "render",
            value: function render() {
                var _props = this.props,
                    render = _props.render,
                    component = _props.component;

                if (render) {
                    return this.props.render(Object.assign({}, this.props));
                }

                return _react2.default.createElement(component);
            }
        }
    ]);
    return Route;
})(_react2.default.Component);

exports.default = Route;
//# sourceMappingURL=Route.cmp.js.map
