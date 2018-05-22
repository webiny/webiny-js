"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends2 = require("babel-runtime/helpers/extends");

var _extends3 = _interopRequireDefault(_extends2);

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

var _WidgetContainer = require("./WidgetContainer");

var _WidgetContainer2 = _interopRequireDefault(_WidgetContainer);

var _LayoutWidgetFunctions = require("./LayoutWidgetFunctions");

var _LayoutWidgetFunctions2 = _interopRequireDefault(_LayoutWidgetFunctions);

var _LayoutWidgetSettingsDialog = require("./LayoutWidgetSettingsDialog");

var _LayoutWidgetSettingsDialog2 = _interopRequireDefault(_LayoutWidgetSettingsDialog);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var LayoutWidget = (function(_React$Component) {
    (0, _inherits3.default)(LayoutWidget, _React$Component);

    function LayoutWidget() {
        (0, _classCallCheck3.default)(this, LayoutWidget);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (LayoutWidget.__proto__ || Object.getPrototypeOf(LayoutWidget)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(LayoutWidget, [
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                var _props = this.props,
                    widget = _props.widget,
                    functions = _props.functions,
                    _onChange = _props.onChange,
                    cms = _props.services.cms;

                var isDirty = !!widget.__dirty;

                var editorWidget = cms.getLayoutEditorWidget(widget.type);
                if (!editorWidget) {
                    return null;
                }

                functions.showSettings = function() {
                    return _this2.settingsDialog.show();
                };

                return _react2.default.createElement(
                    "div",
                    { className: (0, _classnames2.default)(_LayoutWidget2.default.editorWidget) },
                    _react2.default.createElement(
                        _react2.default.Fragment,
                        null,
                        _react2.default.createElement(_LayoutWidgetSettingsDialog2.default, {
                            name: widget.id + "-settings",
                            widget: widget,
                            onChange: function onChange(model) {
                                return _onChange({
                                    settings: model,
                                    __dirty:
                                        isDirty || !(0, _isEqual3.default)(model, widget.settings)
                                });
                            },
                            onReady: function onReady(ref) {
                                return (_this2.settingsDialog = ref);
                            }
                        }),
                        _react2.default.createElement(
                            _LayoutWidgetFunctions2.default,
                            (0, _extends3.default)({ widget: widget }, functions)
                        ),
                        _react2.default.cloneElement(
                            editorWidget.widget.renderWidget({
                                WidgetContainer: _WidgetContainer2.default,
                                widget: widget
                            }),
                            {
                                widget: widget,
                                onChange: function onChange(model) {
                                    return _onChange({
                                        data: model,
                                        __dirty:
                                            isDirty || !(0, _isEqual3.default)(model, widget.data)
                                    });
                                }
                            }
                        )
                    )
                );
            }
        }
    ]);
    return LayoutWidget;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(LayoutWidget, { services: ["cms"] });
//# sourceMappingURL=LayoutWidget.js.map
