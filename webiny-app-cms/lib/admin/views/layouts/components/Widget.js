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

var _isEqual2 = require("lodash/isEqual");

var _isEqual3 = _interopRequireDefault(_isEqual2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _webinyApp = require("webiny-app");

var _LayoutWidget = require("./styles/LayoutWidget.scss?");

var _LayoutWidget2 = _interopRequireDefault(_LayoutWidget);

var _WidgetActions = require("./WidgetActions");

var _WidgetActions2 = _interopRequireDefault(_WidgetActions);

var _WidgetSettingsDialog = require("./WidgetSettingsDialog");

var _WidgetSettingsDialog2 = _interopRequireDefault(_WidgetSettingsDialog);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Widget = (function(_React$Component) {
    (0, _inherits3.default)(Widget, _React$Component);

    function Widget() {
        (0, _classCallCheck3.default)(this, Widget);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Widget.__proto__ || Object.getPrototypeOf(Widget)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Widget, [
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                var _props = this.props,
                    widget = _props.widget,
                    _onChange = _props.onChange,
                    actions = _props.actions,
                    children = _props.children;

                var isDirty = !!widget.__dirty;

                return _react2.default.createElement(
                    "div",
                    { className: (0, _classnames2.default)(_LayoutWidget2.default.editorWidget) },
                    _react2.default.createElement(_WidgetSettingsDialog2.default, {
                        name: widget.id + "-settings",
                        widget: widget,
                        onChange: function onChange(model) {
                            return _onChange({
                                settings: model,
                                __dirty: isDirty || !(0, _isEqual3.default)(model, widget.settings)
                            });
                        },
                        onReady: function onReady(ref) {
                            return (_this2.settingsDialog = ref);
                        }
                    }),
                    _react2.default.createElement(
                        _WidgetActions2.default,
                        null,
                        actions({
                            showSettings: function showSettings() {
                                return _this2.settingsDialog.show();
                            }
                        })
                    ),
                    children({ widget: widget, onChange: _onChange })
                );
            }
        }
    ]);
    return Widget;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(Widget);
//# sourceMappingURL=Widget.js.map
