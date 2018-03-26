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

var _ExportModal = require("./Modal/ExportModal");

var _ExportModal2 = _interopRequireDefault(_ExportModal);

var _ImportModal = require("./Modal/ImportModal");

var _ImportModal2 = _interopRequireDefault(_ImportModal);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @i18n.namespace Webiny.Backend.Acl.UserRolesList
 */
var UserRolesList = (function(_Webiny$Ui$View) {
    (0, _inherits3.default)(UserRolesList, _Webiny$Ui$View);

    function UserRolesList() {
        (0, _classCallCheck3.default)(this, UserRolesList);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (UserRolesList.__proto__ || Object.getPrototypeOf(UserRolesList)).apply(this, arguments)
        );
    }

    return UserRolesList;
})(_webinyClient.Webiny.Ui.View);

UserRolesList.defaultProps = {
    renderer: function renderer() {
        var _this2 = this;

        var listProps = {
            ref: function ref(_ref) {
                return (_this2.list = _ref);
            },
            api: "/entities/webiny/user-roles",
            fields: "id,name,slug,description,createdOn",
            connectToRouter: true,
            query: { _sort: "name" },
            searchFields: "name,slug,description",
            perPage: 25
        };

        var Ui = this.props.Ui;

        var Table = Ui.List.Table;

        var users = _react2.default.createElement(
            Ui.Link,
            { route: "Users.List" },
            this.i18n("Users")
        );
        var permissions = _react2.default.createElement(
            Ui.Link,
            { route: "UserPermissions.List" },
            this.i18n("Permissions")
        );

        return _react2.default.createElement(
            Ui.ViewSwitcher,
            null,
            _react2.default.createElement(
                Ui.ViewSwitcher.View,
                { view: "listView", defaultView: true },
                function(_ref2) {
                    var showView = _ref2.showView;
                    return _react2.default.createElement(
                        Ui.View.List,
                        null,
                        _react2.default.createElement(
                            Ui.View.Header,
                            {
                                title: _this2.i18n("ACL - Roles"),
                                description: _react2.default.createElement(
                                    "span",
                                    null,
                                    _this2.i18n(
                                        "Roles are a simple way to control what permissions certain users have.\n                                                    Create a role with a set of {permissions} and then assign roles to\n                                                    {users}.",
                                        { permissions: permissions, users: users }
                                    )
                                )
                            },
                            _react2.default.createElement(
                                Ui.ButtonGroup,
                                null,
                                _react2.default.createElement(
                                    Ui.Link,
                                    { type: "primary", route: "UserRoles.Create" },
                                    _react2.default.createElement(Ui.Icon, {
                                        icon: "icon-plus-circled"
                                    }),
                                    _this2.i18n("Create")
                                ),
                                _react2.default.createElement(Ui.Button, {
                                    type: "secondary",
                                    onClick: showView("importModal"),
                                    icon: "fa-upload",
                                    label: _this2.i18n("Import")
                                })
                            )
                        ),
                        _react2.default.createElement(
                            Ui.View.Body,
                            null,
                            _react2.default.createElement(
                                Ui.List,
                                listProps,
                                _react2.default.createElement(Ui.List.FormFilters, null, function(
                                    _ref3
                                ) {
                                    var apply = _ref3.apply;
                                    return _react2.default.createElement(
                                        Ui.Grid.Row,
                                        null,
                                        _react2.default.createElement(
                                            Ui.Grid.Col,
                                            { all: 12 },
                                            _react2.default.createElement(Ui.Input, {
                                                name: "_searchQuery",
                                                placeholder: _this2.i18n(
                                                    "Search by name, description or slug"
                                                ),
                                                onEnter: apply()
                                            })
                                        )
                                    );
                                }),
                                _react2.default.createElement(
                                    Table,
                                    null,
                                    _react2.default.createElement(
                                        Table.Row,
                                        null,
                                        _react2.default.createElement(
                                            Table.Field,
                                            {
                                                name: "name",
                                                label: _this2.i18n("Name"),
                                                sort: "name"
                                            },
                                            function(_ref4) {
                                                var data = _ref4.data;
                                                return _react2.default.createElement(
                                                    "span",
                                                    null,
                                                    _react2.default.createElement(
                                                        Ui.Link,
                                                        {
                                                            route: "UserRoles.Edit",
                                                            params: { id: data.id }
                                                        },
                                                        _react2.default.createElement(
                                                            "strong",
                                                            null,
                                                            data.name
                                                        )
                                                    ),
                                                    _react2.default.createElement("br", null),
                                                    data.description
                                                );
                                            }
                                        ),
                                        _react2.default.createElement(Table.Field, {
                                            name: "slug",
                                            label: _this2.i18n("Slug"),
                                            sort: "slug"
                                        }),
                                        _react2.default.createElement(
                                            Table.Actions,
                                            null,
                                            _react2.default.createElement(Table.EditAction, {
                                                route: "UserRoles.Edit"
                                            }),
                                            _react2.default.createElement(Table.Action, {
                                                label: _this2.i18n("Export"),
                                                icon: "fa-download",
                                                onClick: showView("exportModal")
                                            }),
                                            _react2.default.createElement(Table.DeleteAction, null)
                                        )
                                    )
                                ),
                                _react2.default.createElement(Ui.List.Pagination, null)
                            )
                        )
                    );
                }
            ),
            _react2.default.createElement(
                Ui.ViewSwitcher.View,
                { view: "exportModal", modal: true },
                function(_ref5) {
                    var data = _ref5.data.data;
                    return _react2.default.createElement(_ExportModal2.default, {
                        data: data,
                        map: "permissions",
                        api: "/entities/webiny/user-roles",
                        fields: "name,slug,description,isAdminRole,permissions.slug",
                        label: _this2.i18n("Role")
                    });
                }
            ),
            _react2.default.createElement(
                Ui.ViewSwitcher.View,
                { view: "importModal", modal: true },
                function() {
                    return _react2.default.createElement(_ImportModal2.default, {
                        api: "/entities/webiny/user-roles",
                        label: _this2.i18n("Role"),
                        onImported: function onImported() {
                            return _this2.list.loadData();
                        }
                    });
                }
            )
        );
    }
};

exports.default = _webinyClient.Webiny.createComponent(UserRolesList, {
    modulesProp: "Ui",
    modules: [
        "ViewSwitcher",
        "View",
        "Link",
        "Icon",
        "Grid",
        "Input",
        "List",
        "Button",
        "ButtonGroup"
    ]
});
//# sourceMappingURL=UserRolesList.js.map
