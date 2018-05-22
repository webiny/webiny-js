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

var _EditorWidgetSettings = require("./EditorWidgetSettings");

var _EditorWidgetSettings2 = _interopRequireDefault(_EditorWidgetSettings);

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
                    Alert = _props$modules.Alert,
                    cms = _props.services.cms,
                    widget = _props.widget,
                    onChange = _props.onChange,
                    isGlobal = _props.isGlobal;

                var editorWidget = cms.getEditorWidget(widget.type);

                var title = "Widget settings";
                if (widget.origin) {
                    title = "Global widget settings";
                }

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
                            return _react2.default.createElement(
                                Modal.Content,
                                null,
                                _react2.default.createElement(Modal.Header, {
                                    title: title,
                                    onClose: _this2.props.hide
                                }),
                                _react2.default.createElement(
                                    Modal.Body,
                                    null,
                                    widget.origin &&
                                        _react2.default.createElement(
                                            Alert,
                                            { type: "warning" },
                                            "These settings affect this widget everywhere on the website!"
                                        ),
                                    _react2.default.cloneElement(
                                        editorWidget.widget.renderSettings({
                                            EditorWidgetSettings: _EditorWidgetSettings2.default,
                                            widget: widget
                                        }),
                                        {
                                            Bind: Bind,
                                            settings: model,
                                            widget: widget,
                                            onChange: onChange,
                                            isGlobal: isGlobal
                                        }
                                    )
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
        modules: ["Form", "Modal", "Button", "Alert"],
        services: ["cms"]
    }
);
//# sourceMappingURL=WidgetSettingsDialog.js.map
