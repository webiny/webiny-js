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
 * @i18n.namespace Webiny.Backend.Acl.UserRolesForm
 */
var UserRolesForm = (function(_Webiny$Ui$View) {
    (0, _inherits3.default)(UserRolesForm, _Webiny$Ui$View);

    function UserRolesForm() {
        (0, _classCallCheck3.default)(this, UserRolesForm);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (UserRolesForm.__proto__ || Object.getPrototypeOf(UserRolesForm)).apply(this, arguments)
        );
    }

    return UserRolesForm;
})(_webinyClient.Webiny.Ui.View);

UserRolesForm.defaultProps = {
    renderer: function renderer() {
        var _this2 = this;

        var formProps = {
            api: "/entities/webiny/user-roles",
            fields: "*,permissions,isAdminRole",
            connectToRouter: true,
            onSubmitSuccess: "UserRoles.List",
            onCancel: "UserRoles.List",
            onSuccessMessage: function onSuccessMessage(_ref) {
                var model = _ref.model;

                return _react2.default.createElement(
                    "span",
                    null,
                    _this2.i18n("Role {role} was saved successfully!", {
                        role: _react2.default.createElement("strong", null, model.name)
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
                        ? _this2.i18n("ACL - Edit Role")
                        : _this2.i18n("ACL - Create Role")
                }),
                _react2.default.createElement(
                    Ui.View.Body,
                    null,
                    _react2.default.createElement(Ui.Section, { title: _this2.i18n("General") }),
                    _react2.default.createElement(
                        Ui.Grid.Row,
                        null,
                        _react2.default.createElement(
                            Ui.Grid.Col,
                            { all: 6 },
                            _react2.default.createElement(Ui.Input, {
                                label: _this2.i18n("Name"),
                                name: "name",
                                validate: "required"
                            })
                        ),
                        _react2.default.createElement(
                            Ui.Grid.Col,
                            { all: 6 },
                            _react2.default.createElement(Ui.Input, {
                                label: _this2.i18n("Slug"),
                                name: "slug",
                                validate: "required"
                            })
                        )
                    ),
                    _react2.default.createElement(
                        Ui.Grid.Row,
                        null,
                        _react2.default.createElement(
                            Ui.Grid.Col,
                            { all: 12 },
                            _react2.default.createElement(Ui.Input, {
                                label: _this2.i18n("Description"),
                                name: "description",
                                validate: "required"
                            })
                        ),
                        _react2.default.createElement(
                            Ui.Grid.Col,
                            { all: 12 },
                            _react2.default.createElement(Ui.Switch, {
                                label: _this2.i18n("Is admin role?"),
                                name: "isAdminRole",
                                description: _this2.i18n(
                                    "If enabled, this role will be assigned to the admin user who is installing the corresponding app"
                                )
                            })
                        )
                    ),
                    _react2.default.createElement(Ui.UserPermissions, { name: "permissions" })
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
                        label: _this2.i18n("Save role"),
                        align: "right"
                    })
                )
            );
        });
    }
};

exports.default = _webinyClient.Webiny.createComponent(UserRolesForm, {
    modulesProp: "Ui",
    modules: [
        "Switch",
        "Form",
        "View",
        "Tabs",
        "Input",
        "Button",
        "Grid",
        "Section",
        { UserPermissions: "Webiny/Backend/UserPermissions" }
    ]
});
//# sourceMappingURL=UserRolesForm.js.map
