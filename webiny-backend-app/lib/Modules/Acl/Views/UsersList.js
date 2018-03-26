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

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @i18n.namespace Webiny.Backend.Acl.UsersList
 */
var UsersList = (function(_Webiny$Ui$View) {
    (0, _inherits3.default)(UsersList, _Webiny$Ui$View);

    function UsersList() {
        (0, _classCallCheck3.default)(this, UsersList);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (UsersList.__proto__ || Object.getPrototypeOf(UsersList)).call(this)
        );

        _this.bindMethods("renderFullNameField");
        return _this;
    }

    (0, _createClass3.default)(UsersList, [
        {
            key: "renderFullNameField",
            value: function renderFullNameField(row) {
                var fullName = _lodash2.default.trim(row.data.firstName + " " + row.data.lastName);
                fullName = _lodash2.default.isEmpty(fullName) ? row.data.email : fullName;
                return _react2.default.createElement(
                    "span",
                    null,
                    _react2.default.createElement("strong", null, fullName),
                    _react2.default.createElement("br", null),
                    row.data.id
                );
            }
        }
    ]);
    return UsersList;
})(_webinyClient.Webiny.Ui.View);

UsersList.defaultProps = {
    renderer: function renderer() {
        var _this2 = this;

        var listProps = {
            api: "/entities/webiny/users",
            fields: "id,enabled,firstName,lastName,email,createdOn,gravatar",
            connectToRouter: true,
            searchFields: "firstName,lastName,email"
        };

        var _props = this.props,
            View = _props.View,
            List = _props.List,
            Link = _props.Link,
            Icon = _props.Icon,
            Input = _props.Input;

        var Table = List.Table;

        var roles = _react2.default.createElement(
            Link,
            { route: "UserRoles.List" },
            this.i18n("Roles")
        );
        var permissions = _react2.default.createElement(
            Link,
            { route: "UserPermissions.List" },
            this.i18n("Permissions")
        );

        return _react2.default.createElement(
            View.List,
            null,
            _react2.default.createElement(
                View.Header,
                {
                    title: this.i18n("ACL - Users"),
                    description: _react2.default.createElement(
                        "span",
                        null,
                        this.i18n(
                            "Once your system {permissions} and {roles} are defined,\n                                        you can create your system users here.",
                            { permissions: permissions, roles: roles }
                        )
                    )
                },
                _react2.default.createElement(
                    Link,
                    { type: "primary", route: "Users.Create", align: "right" },
                    _react2.default.createElement(Icon, { icon: "icon-plus-circled" }),
                    this.i18n("Create user")
                )
            ),
            _react2.default.createElement(
                View.Body,
                null,
                _react2.default.createElement(
                    List,
                    listProps,
                    _react2.default.createElement(List.FormFilters, null, function(_ref) {
                        var apply = _ref.apply;
                        return _react2.default.createElement(Input, {
                            name: "_searchQuery",
                            placeholder: _this2.i18n("Search by name or email"),
                            onEnter: apply()
                        });
                    }),
                    _react2.default.createElement(
                        Table,
                        null,
                        _react2.default.createElement(
                            Table.Row,
                            null,
                            _react2.default.createElement(Table.GravatarField, {
                                name: "gravatar"
                            }),
                            _react2.default.createElement(
                                Table.Field,
                                {
                                    name: "firstName",
                                    label: this.i18n("First Name"),
                                    sort: "firstName",
                                    route: "Users.Edit"
                                },
                                this.renderFullNameField
                            ),
                            _react2.default.createElement(Table.Field, {
                                name: "email",
                                sort: "email",
                                label: this.i18n("Email")
                            }),
                            _react2.default.createElement(Table.ToggleField, {
                                name: "enabled",
                                label: this.i18n("Status"),
                                sort: "enabled",
                                align: "center",
                                message: function message(_ref2) {
                                    var value = _ref2.value;

                                    if (!value) {
                                        return _this2.i18n(
                                            "This will disable user's account and prevent him from logging in!"
                                        );
                                    }
                                    return null;
                                }
                            }),
                            _react2.default.createElement(Table.DateField, {
                                name: "createdOn",
                                label: this.i18n("Created On"),
                                sort: "createdOn"
                            }),
                            _react2.default.createElement(
                                Table.Actions,
                                null,
                                _react2.default.createElement(Table.EditAction, {
                                    route: "Users.Edit"
                                }),
                                _react2.default.createElement(Table.DeleteAction, null)
                            )
                        ),
                        _react2.default.createElement(Table.Footer, null)
                    ),
                    _react2.default.createElement(List.Pagination, null)
                )
            )
        );
    }
};

exports.default = _webinyClient.Webiny.createComponent(UsersList, {
    modules: ["View", "List", "Link", "Icon", "Input"]
});
//# sourceMappingURL=UsersList.js.map
