"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _objectWithoutProperties2 = require("babel-runtime/helpers/objectWithoutProperties");

var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _get2 = require("lodash/get");

var _get3 = _interopRequireDefault(_get2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var PriceField = (function(_React$Component) {
    (0, _inherits3.default)(PriceField, _React$Component);

    function PriceField() {
        (0, _classCallCheck3.default)(this, PriceField);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (PriceField.__proto__ || Object.getPrototypeOf(PriceField)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(PriceField, [
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                var _props = this.props,
                    List = _props.List,
                    render = _props.render,
                    props = (0, _objectWithoutProperties3.default)(_props, ["List", "render"]);

                if (render) {
                    return render.call(this);
                }

                var value = (0, _get3.default)(this.props.data, this.props.name);

                return _react2.default.createElement(List.Table.Field, props, function() {
                    return value
                        ? _webinyApp.i18n.number(value, _this2.props.format)
                        : _this2.props.default;
                });
            }
        }
    ]);
    return PriceField;
})(_react2.default.Component);

PriceField.defaultProps = {
    format: null,
    default: "-"
};

exports.default = (0, _webinyApp.createComponent)(PriceField, {
    modules: ["List"],
    tableField: true
});
//# sourceMappingURL=NumberField.js.map
