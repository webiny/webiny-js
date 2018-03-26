"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyClient = require("webiny-client");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @i18n.namespace Webiny.Backend.Acl.UsersForm
 */
var UsersForm = (function(_Webiny$Ui$View) {
    (0, _inherits3.default)(UsersForm, _Webiny$Ui$View);

    function UsersForm() {
        (0, _classCallCheck3.default)(this, UsersForm);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (UsersForm.__proto__ || Object.getPrototypeOf(UsersForm)).apply(this, arguments)
        );
    }

    return UsersForm;
})(_webinyClient.Webiny.Ui.View);

UsersForm.defaultProps = {
    renderer: function renderer() {
        var _this2 = this;

        var formProps = {
            api: _webinyClient.Webiny.Auth.getApiEndpoint(),
            fields: "id,firstName,lastName,email,roles,roleGroups,enabled",
            connectToRouter: true,
            onSubmitSuccess: function onSubmitSuccess() {
                _webinyClient.Webiny.Auth.refresh();
                _webinyClient.Webiny.Router.goToRoute("Users.List");
            },
            onCancel: "Users.List",
            onSuccessMessage: function onSuccessMessage(_ref) {
                var model = _ref.model;

                return _react2.default.createElement(
                    "span",
                    null,
                    _this2.i18n("User {user} was saved successfully!", {
                        user: _react2.default.createElement("strong", null, model.firstName)
                    })
                );
            }
        };

        var Ui = this.props.Ui;

        return _react2.default.createElement(Ui.Form, formProps, function(_ref2) {
            var model = _ref2.model,
                form = _ref2.form;
            return _react2.default.createElement(
                Ui.View.Form,
                null,
                _react2.default.createElement(Ui.View.Header, {
                    title: model.id
                        ? _this2.i18n("ACL - Edit User")
                        : _this2.i18n("ACL - Create User")
                }),
                _react2.default.createElement(Ui.Form.Error, {
                    message: _this2.i18n("Something went wrong during save")
                }),
                _react2.default.createElement(
                    Ui.View.Body,
                    null,
                    _react2.default.createElement(
                        Ui.Grid.Row,
                        null,
                        _react2.default.createElement(
                            Ui.Grid.Col,
                            { all: 6 },
                            _react2.default.createElement(Ui.Section, {
                                title: _this2.i18n("Info")
                            }),
                            _react2.default.createElement(
                                Ui.Grid.Row,
                                null,
                                _react2.default.createElement(
                                    Ui.Grid.Col,
                                    { all: 12 },
                                    _react2.default.createElement(Ui.Input, {
                                        label: _this2.i18n("First name"),
                                        name: "firstName",
                                        validate: "required"
                                    }),
                                    _react2.default.createElement(Ui.Input, {
                                        label: _this2.i18n("Last name"),
                                        name: "lastName",
                                        validate: "required"
                                    }),
                                    _react2.default.createElement(Ui.Input, {
                                        label: _this2.i18n("Email"),
                                        name: "email",
                                        description: _this2.i18n("Your email"),
                                        validate: "required,email"
                                    })
                                )
                            )
                        ),
                        _react2.default.createElement(
                            Ui.Grid.Col,
                            { all: 6 },
                            _react2.default.createElement(Ui.Section, {
                                title: _this2.i18n("Password")
                            }),
                            _react2.default.createElement(
                                Ui.Grid.Row,
                                null,
                                _react2.default.createElement(
                                    Ui.Grid.Col,
                                    { all: 12 },
                                    _react2.default.createElement(Ui.Password, {
                                        label: _this2.i18n("New password"),
                                        name: "password",
                                        placeholder: _this2.i18n("Type a new password")
                                    }),
                                    _react2.default.createElement(
                                        Ui.Password,
                                        {
                                            label: _this2.i18n("Confirm password"),
                                            name: "confirmPassword",
                                            validate: "eq:@password",
                                            placeholder: _this2.i18n("Retype the new password")
                                        },
                                        _react2.default.createElement(
                                            "validator",
                                            { name: "eq" },
                                            _this2.i18n("Passwords do not match")
                                        )
                                    )
                                )
                            )
                        )
                    ),
                    _react2.default.createElement(
                        Ui.Grid.Row,
                        null,
                        _react2.default.createElement(
                            Ui.Grid.Col,
                            { all: 12 },
                            _react2.default.createElement(Ui.Switch, {
                                label: _this2.i18n("Enabled"),
                                name: "enabled"
                            })
                        )
                    ),
                    _react2.default.createElement(
                        Ui.Grid.Row,
                        null,
                        _react2.default.createElement(
                            Ui.Grid.Col,
                            { all: 12 },
                            _react2.default.createElement(
                                Ui.Tabs,
                                null,
                                _react2.default.createElement(
                                    Ui.Tabs.Tab,
                                    { label: _this2.i18n("Roles"), icon: "fa-user" },
                                    _react2.default.createElement(Ui.UserRoles, { name: "roles" })
                                ),
                                _react2.default.createElement(
                                    Ui.Tabs.Tab,
                                    { label: _this2.i18n("Role Groups"), icon: "fa-users" },
                                    _react2.default.createElement(Ui.UserRoleGroups, {
                                        name: "roleGroups"
                                    })
                                )
                            )
                        )
                    )
                ),
                _react2.default.createElement(
                    Ui.View.Footer,
                    null,
                    _react2.default.createElement(Ui.Button, {
                        type: "default",
                        onClick: form.cancel,
                        label: _this2.i18n("Go back")
                    }),
                    _react2.default.createElement(Ui.Button, {
                        type: "primary",
                        onClick: form.submit,
                        label: _this2.i18n("Save user"),
                        align: "right"
                    })
                )
            );
        });
    }
};

exports.default = _webinyClient.Webiny.createComponent(UsersForm, {
    modulesProp: "Ui",
    modules: [
        "View",
        "Form",
        "Grid",
        "Tabs",
        "Input",
        "Password",
        "Switch",
        "Button",
        "Section",
        {
            UserRoles: "Webiny/Backend/UserRoles",
            UserRoleGroups: "Webiny/Backend/UserRoleGroups"
        }
    ]
});
//# sourceMappingURL=UsersForm.js.map
