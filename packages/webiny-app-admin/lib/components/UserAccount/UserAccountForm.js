"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _taggedTemplateLiteral2 = require("babel-runtime/helpers/taggedTemplateLiteral");

var _taggedTemplateLiteral3 = _interopRequireDefault(_taggedTemplateLiteral2);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _templateObject = (0, _taggedTemplateLiteral3.default)(
        ["Account settings were saved!"],
        ["Account settings were saved!"]
    ),
    _templateObject2 = (0, _taggedTemplateLiteral3.default)(
        ["Account Settings"],
        ["Account Settings"]
    ),
    _templateObject3 = (0, _taggedTemplateLiteral3.default)(["Your account"], ["Your account"]),
    _templateObject4 = (0, _taggedTemplateLiteral3.default)(["First name"], ["First name"]),
    _templateObject5 = (0, _taggedTemplateLiteral3.default)(["Last name"], ["Last name"]),
    _templateObject6 = (0, _taggedTemplateLiteral3.default)(["Email"], ["Email"]),
    _templateObject7 = (0, _taggedTemplateLiteral3.default)(["Gravatar"], ["Gravatar"]),
    _templateObject8 = (0, _taggedTemplateLiteral3.default)(["Reset password"], ["Reset password"]),
    _templateObject9 = (0, _taggedTemplateLiteral3.default)(["New password"], ["New password"]),
    _templateObject10 = (0, _taggedTemplateLiteral3.default)(
        ["Type your new password"],
        ["Type your new password"]
    ),
    _templateObject11 = (0, _taggedTemplateLiteral3.default)(
        ["Confirm password"],
        ["Confirm password"]
    ),
    _templateObject12 = (0, _taggedTemplateLiteral3.default)(
        ["Re-type your new password"],
        ["Re-type your new password"]
    ),
    _templateObject13 = (0, _taggedTemplateLiteral3.default)(
        ["Passwords do not match"],
        ["Passwords do not match"]
    ),
    _templateObject14 = (0, _taggedTemplateLiteral3.default)(
        ["Enable 2 Factor Authentication"],
        ["Enable 2 Factor Authentication"]
    ),
    _templateObject15 = (0, _taggedTemplateLiteral3.default)(["Save account"], ["Save account"]);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _TwoFactorAuthActivation = require("./TwoFactorAuthActivation");

var _TwoFactorAuthActivation2 = _interopRequireDefault(_TwoFactorAuthActivation);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

// import TwoFactorAuthConfirmation from './TwoFactorAuthConfirmation';

var t = _webinyApp.i18n.namespace("Webiny.Skeleton.UserAccount");

var UserAccount = (function(_React$Component) {
    (0, _inherits3.default)(UserAccount, _React$Component);

    function UserAccount(props) {
        (0, _classCallCheck3.default)(this, UserAccount);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (UserAccount.__proto__ || Object.getPrototypeOf(UserAccount)).call(this, props)
        );

        _this.auth = _webinyApp.app.services.get("authentication");
        _this.growler = _webinyApp.app.services.get("growler");
        return _this;
    }

    (0, _createClass3.default)(UserAccount, [
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                var formContainer = {
                    api: "/security/auth/me",
                    loadModel: function loadModel(_ref) {
                        var form = _ref.form;

                        form.showLoading();
                        var config = {
                            params: {
                                _fields: "id,firstName,lastName,email,gravatar,twoFactorAuth.status"
                            }
                        };
                        return form.props.api.request(config).then(function(res) {
                            form.hideLoading();
                            return res.data.data;
                        });
                    },
                    onSubmit: function onSubmit(_ref2) {
                        var model = _ref2.model,
                            form = _ref2.form;

                        form.showLoading();
                        return form.props.api
                            .request({ method: "patch", data: model })
                            .then(function(response) {
                                form.hideLoading();
                                if (response.data.code) {
                                    return form.handleApiError(response);
                                }

                                form.setModel({ password: null, confirmPassword: null });
                                _this2.growler.success(t(_templateObject));
                                _this2.auth.refresh();
                            });
                    }
                };

                var Ui = this.props.Ui;

                return _react2.default.createElement(
                    Ui.AdminLayout,
                    null,
                    _react2.default.createElement(Ui.Form, formContainer, function(_ref3) {
                        var model = _ref3.model,
                            form = _ref3.form;
                        return _react2.default.createElement(
                            Ui.View.Form,
                            null,
                            _react2.default.createElement(Ui.View.Header, {
                                title: t(_templateObject2)
                            }),
                            _react2.default.createElement(
                                Ui.View.Body,
                                null,
                                _react2.default.createElement(
                                    Ui.Grid.Row,
                                    null,
                                    _react2.default.createElement(
                                        Ui.Grid.Col,
                                        { md: 6, sm: 12 },
                                        _react2.default.createElement(Ui.Section, {
                                            title: t(_templateObject3)
                                        }),
                                        _react2.default.createElement(Ui.Input, {
                                            label: t(_templateObject4),
                                            name: "firstName",
                                            validators: "required"
                                        }),
                                        _react2.default.createElement(Ui.Input, {
                                            label: t(_templateObject5),
                                            name: "lastName",
                                            validators: "required"
                                        }),
                                        _react2.default.createElement(Ui.Email, {
                                            label: t(_templateObject6),
                                            name: "email",
                                            validators: "required"
                                        }),
                                        _react2.default.createElement(
                                            "div",
                                            { className: "form-group" },
                                            _react2.default.createElement(
                                                "label",
                                                { className: "control-label" },
                                                t(_templateObject7)
                                            ),
                                            _react2.default.createElement(
                                                "div",
                                                { className: "input-group" },
                                                _react2.default.createElement(Ui.Gravatar, {
                                                    hash: model.gravatar,
                                                    size: 100
                                                })
                                            )
                                        )
                                    ),
                                    _react2.default.createElement(
                                        Ui.Grid.Col,
                                        { md: 6, sm: 12 },
                                        _react2.default.createElement(Ui.Section, {
                                            title: t(_templateObject8)
                                        }),
                                        _react2.default.createElement(Ui.Password, {
                                            label: t(_templateObject9),
                                            name: "password",
                                            placeholder: t(_templateObject10)
                                        }),
                                        _react2.default.createElement(
                                            Ui.Password,
                                            {
                                                label: t(_templateObject11),
                                                name: "confirmPassword",
                                                validators: "eq:@password",
                                                placeholder: t(_templateObject12)
                                            },
                                            _react2.default.createElement(
                                                "validator",
                                                { name: "eq" },
                                                t(_templateObject13)
                                            )
                                        ),
                                        _react2.default.createElement(
                                            Ui.ChangeConfirm,
                                            {
                                                message: function message(_ref4) {
                                                    var value = _ref4.value;
                                                    return value ? "Dummy" : null;
                                                },
                                                renderDialog: function renderDialog() {
                                                    return _react2.default.createElement(
                                                        _TwoFactorAuthActivation2.default,
                                                        null
                                                    );
                                                },
                                                onComplete: function onComplete() {
                                                    return _this2.twoFactorAuthConfirmation.show();
                                                }
                                            },
                                            _react2.default.createElement(Ui.Switch, {
                                                label: t(_templateObject14),
                                                name: "twoFactorAuth.status"
                                            })
                                        )
                                    )
                                )
                            ),
                            _react2.default.createElement(
                                Ui.View.Footer,
                                { align: "right" },
                                _react2.default.createElement(Ui.Button, {
                                    type: "primary",
                                    onClick: form.submit,
                                    label: t(_templateObject15)
                                })
                            )
                        );
                    })
                );
            }
        }
    ]);
    return UserAccount;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(UserAccount, {
    modulesProp: "Ui",
    modules: [
        { AdminLayout: "Skeleton.AdminLayout" },
        "View",
        "Form",
        "Grid",
        "Gravatar",
        "Input",
        "Email",
        "Password",
        "Button",
        "Section",
        "ChangeConfirm",
        "Switch",
        "Modal",
        "Data",
        "Link",
        "Icon"
    ]
});
//# sourceMappingURL=UserAccountForm.js.map
