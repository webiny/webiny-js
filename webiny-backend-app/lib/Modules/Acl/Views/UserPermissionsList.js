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
 * @i18n.namespace Webiny.Backend.Acl.UserPermissionsList
 */
var UserPermissionsList = (function(_Webiny$Ui$View) {
    (0, _inherits3.default)(UserPermissionsList, _Webiny$Ui$View);

    function UserPermissionsList() {
        (0, _classCallCheck3.default)(this, UserPermissionsList);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (UserPermissionsList.__proto__ || Object.getPrototypeOf(UserPermissionsList)).apply(
                this,
                arguments
            )
        );
    }

    return UserPermissionsList;
})(_webinyClient.Webiny.Ui.View);

UserPermissionsList.defaultProps = {
    renderer: function renderer() {
        var _this2 = this;

        var Ui = this.props.Ui;

        var Table = Ui.List.Table;

        var listProps = {
            ref: function ref(_ref) {
                return (_this2.list = _ref);
            },
            api: "/entities/webiny/user-permissions",
            fields: "id,name,slug,createdOn,description",
            connectToRouter: true,
            query: { _sort: "name" },
            searchFields: "name,slug",
            perPage: 25
        };

        var rolesLink = _react2.default.createElement(
            Ui.Link,
            { route: "UserRoles.List" },
            this.i18n("Roles")
        );

        return _react2.default.createElement(
            Ui.ViewSwitcher,
            null,
            _react2.default.createElement(
                Ui.ViewSwitcher.View,
                { view: "permissionsList", defaultView: true },
                function(_ref2) {
                    var showView = _ref2.showView;
                    return _react2.default.createElement(
                        Ui.View.List,
                        null,
                        _react2.default.createElement(
                            Ui.View.Header,
                            {
                                title: _this2.i18n("ACL - Permissions"),
                                description: _react2.default.createElement(
                                    "span",
                                    null,
                                    _this2.i18n(
                                        "Permissions define what a user is allowed to do with entities and services.\n                                                    Define permissions and then group them into {rolesLink}.",
                                        { rolesLink: rolesLink }
                                    )
                                )
                            },
                            _react2.default.createElement(
                                Ui.ButtonGroup,
                                null,
                                _react2.default.createElement(
                                    Ui.Link,
                                    { type: "primary", route: "UserPermissions.Create" },
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
                                                placeholder: _this2.i18n("Search by name or slug"),
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
                                                            route: "UserPermissions.Edit",
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
                                                route: "UserPermissions.Edit"
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
                        api: "/entities/webiny/user-permissions",
                        fields: "name,slug,description,permissions",
                        label: _this2.i18n("Permission")
                    });
                }
            ),
            _react2.default.createElement(
                Ui.ViewSwitcher.View,
                { view: "importModal", modal: true },
                function() {
                    return _react2.default.createElement(_ImportModal2.default, {
                        api: "/entities/webiny/user-permissions",
                        label: _this2.i18n("Permission"),
                        onImported: function onImported() {
                            return _this2.list.loadData();
                        }
                    });
                }
            )
        );
    }
};

exports.default = _webinyClient.Webiny.createComponent(UserPermissionsList, {
    modulesProp: "Ui",
    modules: [
        "ViewSwitcher",
        "Link",
        "View",
        "List",
        "Icon",
        "Grid",
        "Input",
        "Button",
        "ButtonGroup"
    ]
});
//# sourceMappingURL=UserPermissionsList.js.map
