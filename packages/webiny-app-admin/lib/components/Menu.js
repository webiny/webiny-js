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

var Menu = (function(_React$Component) {
    (0, _inherits3.default)(Menu, _React$Component);

    function Menu() {
        (0, _classCallCheck3.default)(this, Menu);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Menu.__proto__ || Object.getPrototypeOf(Menu)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Menu, [
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render(this);
                }

                return null;
            }
        }
    ]);
    return Menu;
})(_react2.default.Component);

Menu.defaultProps = {
    id: null,
    label: null,
    icon: null,
    order: 100,
    role: null,
    route: null,
    level: 0,
    overwriteExisting: false
};

exports.default = Menu;
//# sourceMappingURL=Menu.js.map
