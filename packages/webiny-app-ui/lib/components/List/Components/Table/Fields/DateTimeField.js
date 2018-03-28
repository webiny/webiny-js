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

var DateTimeField = (function(_React$Component) {
    (0, _inherits3.default)(DateTimeField, _React$Component);

    function DateTimeField() {
        (0, _classCallCheck3.default)(this, DateTimeField);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (DateTimeField.__proto__ || Object.getPrototypeOf(DateTimeField)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(DateTimeField, [
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                var _props = this.props,
                    List = _props.List,
                    format = _props.format,
                    render = _props.render,
                    props = (0, _objectWithoutProperties3.default)(_props, [
                        "List",
                        "format",
                        "render"
                    ]);

                if (render) {
                    return render.call(this);
                }

                var datetime = (0, _get3.default)(this.props.data, this.props.name);

                return _react2.default.createElement(List.Table.Field, props, function() {
                    try {
                        return _webinyApp.i18n.dateTime(datetime, format);
                    } catch (e) {
                        return _this2.props.default;
                    }
                });
            }
        }
    ]);
    return DateTimeField;
})(_react2.default.Component);

DateTimeField.defaultProps = {
    name: null,
    default: "-",
    format: null
};

exports.default = (0, _webinyApp.createComponent)(DateTimeField, {
    modules: ["List"],
    tableField: true
});
//# sourceMappingURL=DateTimeField.js.map
