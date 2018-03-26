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

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyClient = require("webiny-client");

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

var _RegisterModal = require("./../Components/RegisterModal");

var _RegisterModal2 = _interopRequireDefault(_RegisterModal);

var _ForgotPasswordModal = require("./../Components/ForgotPasswordModal");

var _ForgotPasswordModal2 = _interopRequireDefault(_ForgotPasswordModal);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @i18n.namespace Webiny.Backend.Marketplace.LoginRegister
 */
var LoginRegister = (function(_Webiny$Ui$View) {
    (0, _inherits3.default)(LoginRegister, _Webiny$Ui$View);

    function LoginRegister(props) {
        (0, _classCallCheck3.default)(this, LoginRegister);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (LoginRegister.__proto__ || Object.getPrototypeOf(LoginRegister)).call(this, props)
        );

        _this.bindMethods("showLogin,showRegister,showForgotPassword");
        return _this;
    }

    (0, _createClass3.default)(LoginRegister, [
        {
            key: "showLogin",
            value: function showLogin() {
                this.loginModal.show();
            }
        },
        {
            key: "showRegister",
            value: function showRegister() {
                this.registerModal.show();
            }
        },
        {
            key: "showForgotPassword",
            value: function showForgotPassword() {
                this.forgotPasswordModal.show();
            }
        }
    ]);
    return LoginRegister;
})(_webinyClient.Webiny.Ui.View);

LoginRegister.defaultProps = {
    renderer: function renderer() {
        var _this2 = this;

        var _props = this.props,
            styles = _props.styles,
            Button = _props.Button,
            Icon = _props.Icon,
            Form = _props.Form,
            Input = _props.Input,
            Grid = _props.Grid,
            Password = _props.Password,
            Link = _props.Link;

        var childProps = {
            showLogin: this.showLogin,
            showRegister: this.showRegister,
            showForgotPassword: this.showForgotPassword,
            onUser: this.props.onUser
        };

        var formProps = {
            api: "/services/webiny/marketplace",
            url: "login",
            onSubmitSuccess: function onSubmitSuccess(_ref) {
                var apiResponse = _ref.apiResponse;
                return _this2.props.onUser(apiResponse.getData());
            },
            onSuccessMessage: null
        };

        var cantRemember = _react2.default.createElement(
            Link,
            {
                className: this.classSet(styles.cantRemember, "small"),
                onClick: this.showForgotPassword
            },
            "I CAN'T REMEMBER"
        );

        return _react2.default.createElement(Form, formProps, function(_ref2) {
            var form = _ref2.form;
            return _react2.default.createElement(
                "div",
                { className: styles.loginRegister },
                _react2.default.createElement(
                    "div",
                    { className: styles.message },
                    _react2.default.createElement(
                        "h2",
                        null,
                        _react2.default.createElement(Icon, { icon: "icon-basket_n" }),
                        " ",
                        _this2.i18n("Webiny Marketplace")
                    ),
                    _react2.default.createElement(
                        "h3",
                        null,
                        _this2.i18n("Find and Install Apps for Webiny")
                    ),
                    _react2.default.createElement(
                        "p",
                        null,
                        _this2.i18n("Access to the marketplace requires a Webiny.com profile."),
                        _react2.default.createElement("br", null),
                        _this2.i18n(
                            "If you already have a profile, please sign-in, otherwise please register."
                        )
                    ),
                    _react2.default.createElement(
                        "div",
                        { className: styles.loginForm },
                        _react2.default.createElement(
                            Grid.Row,
                            null,
                            _react2.default.createElement(Form.Loader, null),
                            _react2.default.createElement(
                                Grid.Col,
                                { all: 12 },
                                _react2.default.createElement(Form.Error, null),
                                _react2.default.createElement(Input, {
                                    placeholder: _this2.i18n("Email"),
                                    label: _this2.i18n("Email"),
                                    name: "username",
                                    validate: "required, email",
                                    onEnter: form.submit
                                })
                            ),
                            _react2.default.createElement(
                                Grid.Col,
                                { all: 12 },
                                _react2.default.createElement(Password, {
                                    label: _this2.i18n("Password"),
                                    placeholder: _this2.i18n("Password"),
                                    name: "password",
                                    validate: "required",
                                    onEnter: form.submit,
                                    description: cantRemember
                                })
                            ),
                            _react2.default.createElement(
                                Grid.Col,
                                { all: 12, className: styles.modalAction },
                                _react2.default.createElement(Button, {
                                    type: "primary",
                                    onClick: form.submit,
                                    size: "large",
                                    icon: "icon-next",
                                    label: _this2.i18n("Sign In")
                                })
                            )
                        )
                    ),
                    _react2.default.createElement(
                        "div",
                        { className: styles.actions },
                        _react2.default.createElement(
                            "div",
                            { className: "text-center" },
                            _this2.i18n("Not a member? {signupLink}", {
                                signupLink: _react2.default.createElement(
                                    Link,
                                    { onClick: _this2.showRegister },
                                    _react2.default.createElement("br", null),
                                    "Sign up here"
                                )
                            })
                        )
                    )
                ),
                _react2.default.createElement(
                    _RegisterModal2.default,
                    (0, _extends3.default)({}, childProps, {
                        ref: function ref(_ref3) {
                            return (_this2.registerModal = _ref3);
                        }
                    })
                ),
                _react2.default.createElement(
                    _ForgotPasswordModal2.default,
                    (0, _extends3.default)({}, childProps, {
                        ref: function ref(_ref4) {
                            return (_this2.forgotPasswordModal = _ref4);
                        }
                    })
                )
            );
        });
    }
};

exports.default = _webinyClient.Webiny.createComponent(LoginRegister, {
    styles: _styles2.default,
    modules: ["Button", "Icon", "Form", "Input", "Grid", "Password", "Link"]
});
//# sourceMappingURL=LoginRegister.js.map
