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

var _webinyClient = require("webiny-client");

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _Views = require("./Views/Views");

var _Views2 = _interopRequireDefault(_Views);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @i18n.namespace Webiny.Backend.Acl
 */
var Module = (function(_Webiny$App$Module) {
    (0, _inherits3.default)(Module, _Webiny$App$Module);

    function Module() {
        (0, _classCallCheck3.default)(this, Module);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Module.__proto__ || Object.getPrototypeOf(Module)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Module, [
        {
            key: "init",
            value: function init() {
                this.name = "Acl";
                var Menu = _webinyClient.Webiny.Ui.Menu;

                var aclManageUsers = "webiny-acl-user-manager";
                var aclApiTokens = "webiny-acl-api-token-manager";

                this.registerMenus(
                    _react2.default.createElement(
                        Menu,
                        { label: _webinyClient.Webiny.I18n("ACL"), icon: "icon-users" },
                        _react2.default.createElement(
                            Menu,
                            {
                                label: _webinyClient.Webiny.I18n("User Management"),
                                role: aclManageUsers
                            },
                            _react2.default.createElement(Menu, {
                                label: _webinyClient.Webiny.I18n("Permissions"),
                                route: "UserPermissions.List",
                                order: 1
                            }),
                            _react2.default.createElement(Menu, {
                                label: _webinyClient.Webiny.I18n("Roles"),
                                route: "UserRoles.List",
                                order: 2
                            }),
                            _react2.default.createElement(Menu, {
                                label: _webinyClient.Webiny.I18n("Role Groups"),
                                route: "UserRoleGroups.List",
                                order: 3
                            }),
                            _react2.default.createElement(Menu, {
                                label: _webinyClient.Webiny.I18n("Users"),
                                route: "Users.List",
                                order: 4
                            })
                        ),
                        _react2.default.createElement(
                            Menu,
                            { label: _webinyClient.Webiny.I18n("API"), role: aclApiTokens },
                            _react2.default.createElement(Menu, {
                                label: _webinyClient.Webiny.I18n("Request Logs"),
                                route: "ApiLogs.List"
                            }),
                            _react2.default.createElement(Menu, {
                                label: _webinyClient.Webiny.I18n("Tokens"),
                                route: "ApiTokens.List"
                            })
                        )
                    )
                );

                this.registerRoutes(
                    new _webinyClient.Webiny.Route(
                        "Users.Create",
                        "/acl/users/new",
                        _Views2.default.UsersForm,
                        "ACL - Create User"
                    ).setRole(aclManageUsers),
                    new _webinyClient.Webiny.Route(
                        "Users.Edit",
                        "/acl/users/:id",
                        _Views2.default.UsersForm,
                        "ACL - Edit User"
                    ).setRole(aclManageUsers),
                    new _webinyClient.Webiny.Route(
                        "Users.List",
                        "/acl/users",
                        _Views2.default.UsersList,
                        "ACL - Users"
                    ).setRole(aclManageUsers),
                    new _webinyClient.Webiny.Route(
                        "UserRoles.Create",
                        "/acl/roles/new",
                        _Views2.default.UserRolesForm,
                        "ACL - Create Role"
                    ).setRole(aclManageUsers),
                    new _webinyClient.Webiny.Route(
                        "UserRoles.Edit",
                        "/acl/roles/:id",
                        _Views2.default.UserRolesForm,
                        "ACL - Edit Role"
                    ).setRole(aclManageUsers),
                    new _webinyClient.Webiny.Route(
                        "UserRoles.List",
                        "/acl/roles",
                        _Views2.default.UserRolesList,
                        "ACL - Roles"
                    ).setRole(aclManageUsers),
                    new _webinyClient.Webiny.Route(
                        "UserRoleGroups.Create",
                        "/acl/role-groups/new",
                        _Views2.default.UserRoleGroupsForm,
                        "ACL - Create Role Group"
                    ).setRole(aclManageUsers),
                    new _webinyClient.Webiny.Route(
                        "UserRoleGroups.Edit",
                        "/acl/role-groups/:id",
                        _Views2.default.UserRoleGroupsForm,
                        "ACL - Edit Role Group"
                    ).setRole(aclManageUsers),
                    new _webinyClient.Webiny.Route(
                        "UserRoleGroups.List",
                        "/acl/role-groups",
                        _Views2.default.UserRoleGroupsList,
                        "ACL - Role Groups"
                    ).setRole(aclManageUsers),
                    new _webinyClient.Webiny.Route(
                        "UserPermissions.Create",
                        "/acl/permissions/new",
                        _Views2.default.UserPermissionsForm,
                        "ACL - Create Permission"
                    ).setRole(aclManageUsers),
                    new _webinyClient.Webiny.Route(
                        "UserPermissions.Edit",
                        "/acl/permissions/:id",
                        _Views2.default.UserPermissionsForm,
                        "ACL - Edit Permission"
                    ).setRole(aclManageUsers),
                    new _webinyClient.Webiny.Route(
                        "UserPermissions.List",
                        "/acl/permissions",
                        _Views2.default.UserPermissionsList,
                        "ACL - Permissions"
                    ).setRole(aclManageUsers),
                    new _webinyClient.Webiny.Route(
                        "ApiTokens.List",
                        "/acl/api-tokens",
                        _Views2.default.ApiTokensList,
                        "ACL - API Tokens"
                    ).setRole(aclApiTokens),
                    new _webinyClient.Webiny.Route(
                        "ApiLogs.List",
                        "/acl/api-logs",
                        _Views2.default.ApiLogsList,
                        "ACL - API Logs"
                    ).setRole(aclApiTokens)
                );
            }
        }
    ]);
    return Module;
})(_webinyClient.Webiny.App.Module);

exports.default = Module;
//# sourceMappingURL=index.js.map
