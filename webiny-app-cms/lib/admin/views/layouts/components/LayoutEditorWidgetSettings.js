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

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var LayoutEditorWidgetSettings = (function(_React$Component) {
    (0, _inherits3.default)(LayoutEditorWidgetSettings, _React$Component);

    function LayoutEditorWidgetSettings() {
        (0, _classCallCheck3.default)(this, LayoutEditorWidgetSettings);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (
                LayoutEditorWidgetSettings.__proto__ ||
                Object.getPrototypeOf(LayoutEditorWidgetSettings)
            ).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(LayoutEditorWidgetSettings, [
        {
            key: "render",
            value: function render() {
                var _props = this.props,
                    children = _props.children,
                    Bind = _props.Bind,
                    props = (0, _objectWithoutProperties3.default)(_props, ["children", "Bind"]);

                return _react2.default.cloneElement(children, Object.assign({ Bind: Bind }, props));
            }
        }
    ]);
    return LayoutEditorWidgetSettings;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(LayoutEditorWidgetSettings);
//# sourceMappingURL=LayoutEditorWidgetSettings.js.map
