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

var _get2 = require("babel-runtime/helpers/get");

var _get3 = _interopRequireDefault(_get2);

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
 * @i18n.namespace Webiny.Backend.Marketplace.RegisterModal
 */
var RegisterModal = (function(_Webiny$Ui$ModalCompo) {
    (0, _inherits3.default)(RegisterModal, _Webiny$Ui$ModalCompo);

    function RegisterModal(props) {
        (0, _classCallCheck3.default)(this, RegisterModal);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (RegisterModal.__proto__ || Object.getPrototypeOf(RegisterModal)).call(this, props)
        );

        _this.state = {
            success: false
        };

        _this.bindMethods("login");
        return _this;
    }

    (0, _createClass3.default)(RegisterModal, [
        {
            key: "login",
            value: function login() {
                var _this2 = this;

                this.hide().then(function() {
                    return _this2.props.showLogin();
                });
            }
        },
        {
            key: "show",
            value: function show() {
                this.setState({ success: false });
                return (0, _get3.default)(
                    RegisterModal.prototype.__proto__ ||
                        Object.getPrototypeOf(RegisterModal.prototype),
                    "show",
                    this
                ).call(this);
            }
        },
        {
            key: "renderRegisterForm",
            value: function renderRegisterForm() {
                var _this3 = this;

                var _props = this.props,
                    Modal = _props.Modal,
                    Button = _props.Button,
                    Grid = _props.Grid,
                    Password = _props.Password,
                    Form = _props.Form,
                    Link = _props.Link,
                    Input = _props.Input;

                var containerProps = {
                    api: _webinyClient.Webiny.Auth.getApiEndpoint(),
                    url: "register",
                    fields: "id,firstName,lastName,email",
                    onSubmitSuccess: function onSubmitSuccess() {
                        return _this3.setState({ success: true });
                    },
                    onCancel: this.hide,
                    onSuccessMessage: null
                };

                return _react2.default.createElement(
                    Modal.Dialog,
                    null,
                    _react2.default.createElement(Form, containerProps, function(_ref) {
                        var form = _ref.form;
                        return _react2.default.createElement(
                            Modal.Content,
                            null,
                            _react2.default.createElement(Modal.Header, {
                                title: _this3.i18n("Register"),
                                onClose: _this3.hide
                            }),
                            _react2.default.createElement(
                                Modal.Body,
                                null,
                                _react2.default.createElement(
                                    Grid.Row,
                                    null,
                                    _react2.default.createElement(
                                        Grid.Col,
                                        { all: 12 },
                                        _react2.default.createElement(Form.Error, null)
                                    ),
                                    _react2.default.createElement(
                                        Grid.Col,
                                        { all: 6 },
                                        _react2.default.createElement(Input, {
                                            placeholder: _this3.i18n("First Name"),
                                            label: _this3.i18n("First Name"),
                                            name: "firstName",
                                            validate: "required",
                                            onEnter: form.submit
                                        })
                                    ),
                                    _react2.default.createElement(
                                        Grid.Col,
                                        { all: 6 },
                                        _react2.default.createElement(Input, {
                                            placeholder: _this3.i18n("Last Name"),
                                            label: _this3.i18n("Last Name"),
                                            name: "lastName",
                                            validate: "required",
                                            onEnter: form.submit
                                        })
                                    ),
                                    _react2.default.createElement(
                                        Grid.Col,
                                        { all: 12 },
                                        _react2.default.createElement(Input, {
                                            placeholder: _this3.i18n("Email"),
                                            label: _this3.i18n("Email"),
                                            name: "email",
                                            validate: "required, email",
                                            onEnter: form.submit
                                        })
                                    ),
                                    _react2.default.createElement(
                                        Grid.Col,
                                        { all: 12 },
                                        _react2.default.createElement(Password, {
                                            label: _this3.i18n("Password"),
                                            placeholder: _this3.i18n("Password"),
                                            name: "password",
                                            validate: "required",
                                            onEnter: form.submit
                                        })
                                    )
                                )
                            ),
                            _react2.default.createElement(
                                Modal.Footer,
                                null,
                                _react2.default.createElement(Button, {
                                    type: "secondary",
                                    onClick: form.submit,
                                    size: "large",
                                    icon: "icon-next",
                                    label: _this3.i18n("Register")
                                })
                            )
                        );
                    })
                );
            }
        },
        {
            key: "renderSuccess",
            value: function renderSuccess() {
                var _props2 = this.props,
                    Modal = _props2.Modal,
                    Icon = _props2.Icon,
                    Link = _props2.Link;

                return _react2.default.createElement(
                    Modal.Dialog,
                    null,
                    _react2.default.createElement(
                        Modal.Content,
                        null,
                        _react2.default.createElement(
                            Modal.Body,
                            null,
                            _react2.default.createElement(
                                "div",
                                { className: "text-center" },
                                _react2.default.createElement("br", null),
                                _react2.default.createElement(Icon, {
                                    type: "success",
                                    size: "4x",
                                    icon: "fa-check-circle",
                                    element: "div"
                                }),
                                _react2.default.createElement("br", null),
                                _react2.default.createElement("h4", null, this.i18n("Done")),
                                _react2.default.createElement(
                                    "p",
                                    null,
                                    this.i18n("Thanks for registering!")
                                ),
                                _react2.default.createElement(
                                    "p",
                                    null,
                                    this.i18n("Your profile is ready, {backLink}", {
                                        backLink: _react2.default.createElement(
                                            Link,
                                            { className: "text-link", onClick: this.close },
                                            this.i18n("back to login page.")
                                        )
                                    })
                                )
                            )
                        )
                    )
                );
            }
        },
        {
            key: "renderDialog",
            value: function renderDialog() {
                return this.state.success ? this.renderSuccess() : this.renderRegisterForm();
            }
        }
    ]);
    return RegisterModal;
})(_webinyClient.Webiny.Ui.ModalComponent);

exports.default = _webinyClient.Webiny.createComponent(RegisterModal, {
    styles: _styles2.default,
    modules: ["Modal", "Form", "Input", "Password", "Button", "Link", "Icon", "Grid", "Link"]
});
//# sourceMappingURL=RegisterModal.js.map
