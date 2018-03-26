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

var _webinyClient = require("webiny-client");

var _styles = require("./../Views/styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @i18n.namespace Webiny.Backend.Marketplace.ForgotPasswordModal
 */
var ForgotPasswordModal = (function(_Webiny$Ui$ModalCompo) {
    (0, _inherits3.default)(ForgotPasswordModal, _Webiny$Ui$ModalCompo);

    function ForgotPasswordModal(props) {
        (0, _classCallCheck3.default)(this, ForgotPasswordModal);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (ForgotPasswordModal.__proto__ || Object.getPrototypeOf(ForgotPasswordModal)).call(
                this,
                props
            )
        );

        _this.state = {
            success: false
        };
        return _this;
    }

    (0, _createClass3.default)(ForgotPasswordModal, [
        {
            key: "renderDialog",
            value: function renderDialog() {
                var _this2 = this;

                var _props = this.props,
                    Modal = _props.Modal,
                    Form = _props.Form,
                    Button = _props.Button,
                    Input = _props.Input,
                    Link = _props.Link,
                    Grid = _props.Grid,
                    Alert = _props.Alert;

                var formProps = {
                    api: "/services/webiny/marketplace",
                    url: "reset-password",
                    onSuccessMessage: null,
                    onSubmitSuccess: function onSubmitSuccess() {
                        return _this2.setState({ success: true });
                    }
                };

                return _react2.default.createElement(
                    Modal.Dialog,
                    {
                        onHidden: function onHidden() {
                            return _this2.setState({ success: false });
                        }
                    },
                    _react2.default.createElement(Form, formProps, function(_ref) {
                        var form = _ref.form;
                        return _react2.default.createElement(
                            Modal.Content,
                            null,
                            _react2.default.createElement(Form.Loader, null),
                            _react2.default.createElement(Modal.Header, {
                                onClose: _this2.hide,
                                title: _this2.i18n("Forgot Password")
                            }),
                            _react2.default.createElement(
                                Modal.Body,
                                null,
                                _this2.state.success &&
                                    _react2.default.createElement(
                                        Grid.Row,
                                        null,
                                        _react2.default.createElement(
                                            Grid.Col,
                                            { all: 12 },
                                            _react2.default.createElement(
                                                Alert,
                                                {
                                                    type: "success",
                                                    title: _this2.i18n("Instructions sent")
                                                },
                                                _this2.i18n(
                                                    "Please check your inbox for the reset password link."
                                                )
                                            )
                                        )
                                    ),
                                !_this2.state.success &&
                                    _react2.default.createElement(
                                        Grid.Row,
                                        null,
                                        _react2.default.createElement(
                                            Grid.Col,
                                            { all: 12 },
                                            _react2.default.createElement(
                                                "p",
                                                { className: "text-center" },
                                                _this2.i18n(
                                                    "Enter an email address you used to register at webiny.com."
                                                )
                                            ),
                                            _react2.default.createElement(Form.Error, null),
                                            _react2.default.createElement(Input, {
                                                placeholder: _this2.i18n("Email"),
                                                label: _this2.i18n("Email"),
                                                name: "email",
                                                validate: "required, email",
                                                onEnter: form.submit
                                            })
                                        )
                                    )
                            ),
                            !_this2.state.success &&
                                _react2.default.createElement(
                                    Modal.Footer,
                                    null,
                                    _react2.default.createElement(Button, {
                                        type: "primary",
                                        onClick: form.submit,
                                        size: "large",
                                        icon: "icon-next",
                                        label: _this2.i18n("Send me a reset link")
                                    })
                                )
                        );
                    })
                );
            }
        }
    ]);
    return ForgotPasswordModal;
})(_webinyClient.Webiny.Ui.ModalComponent);

exports.default = _webinyClient.Webiny.createComponent(ForgotPasswordModal, {
    styles: _styles2.default,
    modules: ["Modal", "Form", "Button", "Input", "Link", "Grid", "Alert"]
});
//# sourceMappingURL=ForgotPasswordModal.js.map
