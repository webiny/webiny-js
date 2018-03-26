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
 * @i18n.namespace Webiny.Backend.Acl.UserRoleGroupsForm
 */
var UserRoleGroupsForm = (function(_Webiny$Ui$View) {
    (0, _inherits3.default)(UserRoleGroupsForm, _Webiny$Ui$View);

    function UserRoleGroupsForm() {
        (0, _classCallCheck3.default)(this, UserRoleGroupsForm);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (UserRoleGroupsForm.__proto__ || Object.getPrototypeOf(UserRoleGroupsForm)).apply(
                this,
                arguments
            )
        );
    }

    return UserRoleGroupsForm;
})(_webinyClient.Webiny.Ui.View);

UserRoleGroupsForm.defaultProps = {
    renderer: function renderer() {
        var _this2 = this;

        var formProps = {
            api: "/entities/webiny/user-role-groups",
            fields: "*,roles",
            connectToRouter: true,
            onSubmitSuccess: "UserRoleGroups.List",
            onCancel: "UserRoleGroups.List",
            onSuccessMessage: function onSuccessMessage(_ref) {
                var model = _ref.model;

                return _react2.default.createElement(
                    "span",
                    null,
                    _this2.i18n("Role group {group} was saved successfully!", {
                        group: _react2.default.createElement("strong", null, model.name)
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
                        ? _this2.i18n("ACL - Edit Role Group")
                        : _this2.i18n("ACL - Create Role Group")
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
                        )
                    ),
                    _react2.default.createElement(Ui.UserRoles, { name: "roles" })
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
                        label: _this2.i18n("Save role group"),
                        align: "right"
                    })
                )
            );
        });
    }
};

exports.default = _webinyClient.Webiny.createComponent(UserRoleGroupsForm, {
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
        { UserRoles: "Webiny/Backend/UserRoles" }
    ]
});
//# sourceMappingURL=UserRoleGroupsForm.js.map
