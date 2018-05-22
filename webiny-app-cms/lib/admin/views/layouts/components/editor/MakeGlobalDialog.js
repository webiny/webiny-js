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

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var MakeGlobalDialog = (function(_React$Component) {
    (0, _inherits3.default)(MakeGlobalDialog, _React$Component);

    function MakeGlobalDialog() {
        (0, _classCallCheck3.default)(this, MakeGlobalDialog);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (MakeGlobalDialog.__proto__ || Object.getPrototypeOf(MakeGlobalDialog)).apply(
                this,
                arguments
            )
        );
    }

    (0, _createClass3.default)(MakeGlobalDialog, [
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                var _props = this.props,
                    _props$modules = _props.modules,
                    Modal = _props$modules.Modal,
                    Button = _props$modules.Button,
                    Input = _props$modules.Input,
                    Form = _props$modules.Form,
                    cms = _props.services.cms,
                    widget = _props.widget,
                    hide = _props.hide;

                return _react2.default.createElement(
                    Modal.Dialog,
                    null,
                    _react2.default.createElement(
                        Form,
                        {
                            onSubmit: function onSubmit(_ref) {
                                var title = _ref.title;

                                cms
                                    .createGlobalWidget({
                                        title: title,
                                        type: widget.type,
                                        data: widget.data,
                                        settings: widget.settings
                                    })
                                    .then(function(origin) {
                                        hide().then(function() {
                                            return _this2.props.onSuccess(origin);
                                        });
                                    });
                            }
                        },
                        function(_ref2) {
                            var submit = _ref2.submit,
                                model = _ref2.model,
                                Bind = _ref2.Bind;
                            return _react2.default.createElement(
                                Modal.Content,
                                null,
                                _react2.default.createElement(Modal.Header, {
                                    title: "Save to global widgets",
                                    onClose: hide
                                }),
                                _react2.default.createElement(
                                    Modal.Body,
                                    null,
                                    _react2.default.createElement(
                                        Bind,
                                        null,
                                        _react2.default.createElement(Input, {
                                            name: "title",
                                            label: "Widget title",
                                            placeholder: "Enter a title for your widget",
                                            validators: "required"
                                        })
                                    )
                                ),
                                _react2.default.createElement(
                                    Modal.Footer,
                                    { align: "right" },
                                    _react2.default.createElement(Button, {
                                        type: "default",
                                        label: "Cancel",
                                        onClick: hide
                                    }),
                                    _react2.default.createElement(Button, {
                                        type: "primary",
                                        label: "Save widget",
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
    return MakeGlobalDialog;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)([MakeGlobalDialog, _webinyAppUi.ModalComponent], {
    modules: ["Modal", "Button", "Input", "Form"],
    services: ["cms"]
});
//# sourceMappingURL=MakeGlobalDialog.js.map
