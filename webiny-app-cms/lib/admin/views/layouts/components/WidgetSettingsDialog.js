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

var _webinyApp = require("webiny-app");

var _webinyAppUi = require("webiny-app-ui");

var _WidgetSettingsContainer = require("./WidgetSettingsContainer");

var _WidgetSettingsContainer2 = _interopRequireDefault(_WidgetSettingsContainer);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var WidgetSettingsDialog = (function(_React$Component) {
    (0, _inherits3.default)(WidgetSettingsDialog, _React$Component);

    function WidgetSettingsDialog() {
        (0, _classCallCheck3.default)(this, WidgetSettingsDialog);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (WidgetSettingsDialog.__proto__ || Object.getPrototypeOf(WidgetSettingsDialog)).apply(
                this,
                arguments
            )
        );
    }

    (0, _createClass3.default)(WidgetSettingsDialog, [
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                var _props = this.props,
                    _props$modules = _props.modules,
                    Modal = _props$modules.Modal,
                    Button = _props$modules.Button,
                    Form = _props$modules.Form,
                    cms = _props.services.cms,
                    widget = _props.widget,
                    onChange = _props.onChange;

                var editorWidget = cms.getLayoutEditorWidget(widget.type);

                return _react2.default.createElement(
                    Modal.Dialog,
                    null,
                    _react2.default.createElement(
                        Form,
                        {
                            model: widget.settings || {},
                            onSubmit: function onSubmit(model) {
                                return _this2.props.hide().then(function() {
                                    return _this2.props.onChange(model);
                                });
                            }
                        },
                        function(_ref) {
                            var model = _ref.model,
                                submit = _ref.submit,
                                Bind = _ref.Bind;

                            // 1. Render widget settings using widget plugin
                            var widgetSettingsContainer = editorWidget.widget.renderSettings({
                                WidgetSettingsContainer: _WidgetSettingsContainer2.default,
                                widget: widget
                            });

                            // 2. Clone settings container to pass additional props.
                            widgetSettingsContainer = _react2.default.cloneElement(
                                widgetSettingsContainer,
                                {
                                    Bind: Bind,
                                    settings: model,
                                    widget: widget,
                                    onChange: onChange
                                }
                            );

                            return _react2.default.createElement(
                                Modal.Content,
                                null,
                                _react2.default.createElement(Modal.Header, {
                                    title: "Layout widget settings",
                                    onClose: _this2.props.hide
                                }),
                                _react2.default.createElement(
                                    Modal.Body,
                                    null,
                                    widgetSettingsContainer
                                ),
                                _react2.default.createElement(
                                    Modal.Footer,
                                    { align: "right" },
                                    _react2.default.createElement(Button, {
                                        type: "default",
                                        label: "Cancel",
                                        onClick: _this2.props.hide
                                    }),
                                    _react2.default.createElement(Button, {
                                        type: "primary",
                                        label: "Save settings",
                                        onClick: submit
                                    })
                                )
                            );
                        }
                    )
                );
            }
        }
    ]);
    return WidgetSettingsDialog;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(
    [WidgetSettingsDialog, _webinyAppUi.ModalComponent],
    {
        modules: ["Form", "Modal", "Button"],
        services: ["cms"]
    }
);
//# sourceMappingURL=WidgetSettingsDialog.js.map
