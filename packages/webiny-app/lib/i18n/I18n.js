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

var _webiny = require("webiny");

var _webiny2 = _interopRequireDefault(_webiny);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _createComponent = require("./../createComponent");

var _createComponent2 = _interopRequireDefault(_createComponent);

var _Component = require("./../Core/Component");

var _Component2 = _interopRequireDefault(_Component);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var I18n = (function(_React$Component) {
    (0, _inherits3.default)(I18n, _React$Component);

    function I18n() {
        (0, _classCallCheck3.default)(this, I18n);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (I18n.__proto__ || Object.getPrototypeOf(I18n)).apply(this, arguments)
        );
    }

    return I18n;
})(_react2.default.Component);

I18n.defaultProps = {
    textKey: "",
    base: "",
    variables: {},
    renderer: function renderer() {
        return _react2.default.createElement(
            "webiny-i18n",
            {
                base: this.props.base,
                "text-key": this.props.textKey
            },
            _webiny2.default.I18n.translate(
                this.props.base,
                this.props.variables,
                this.props.textKey
            )
        );
    }
};

exports.default = (0, _createComponent2.default)(I18n, { i18n: true });
//# sourceMappingURL=I18n.js.map
