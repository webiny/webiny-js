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

var _get2 = require("babel-runtime/helpers/get");

var _get3 = _interopRequireDefault(_get2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyClient = require("webiny-client");

var _ApiTokenModal = require("./Modal/ApiTokenModal");

var _ApiTokenModal2 = _interopRequireDefault(_ApiTokenModal);

var _SystemApiToken = require("./Modal/SystemApiToken");

var _SystemApiToken2 = _interopRequireDefault(_SystemApiToken);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @i18n.namespace Webiny.Backend.Acl.ApiTokensList
 */
var ApiTokensList = (function(_Webiny$Ui$View) {
    (0, _inherits3.default)(ApiTokensList, _Webiny$Ui$View);

    function ApiTokensList(props) {
        (0, _classCallCheck3.default)(this, ApiTokensList);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (ApiTokensList.__proto__ || Object.getPrototypeOf(ApiTokensList)).call(this, props)
        );

        _this.state = {
            apiToken: null
        };
        return _this;
    }

    (0, _createClass3.default)(ApiTokensList, [
        {
            key: "componentWillMount",
            value: function componentWillMount() {
                var _this2 = this;

                (0, _get3.default)(
                    ApiTokensList.prototype.__proto__ ||
                        Object.getPrototypeOf(ApiTokensList.prototype),
                    "componentWillMount",
                    this
                ).call(this);
                new _webinyClient.Webiny.Api.Endpoint("/services/webiny/acl")
                    .get("token")
                    .then(function(apiResponse) {
                        if (!apiResponse.isError()) {
                            _this2.setState({ apiToken: apiResponse.getData("token") });
                        }
                    });
            }
        }
    ]);
    return ApiTokensList;
})(_webinyClient.Webiny.Ui.View);

ApiTokensList.defaultProps = {
    renderer: function renderer() {
        var _this3 = this;

        return _react2.default.createElement(
            _webinyClient.Webiny.Ui.LazyLoad,
            { modules: ["ViewSwitcher", "View", "Button", "Icon", "List", "Input", "Link"] },
            function(Ui) {
                var Table = Ui.List.Table;

                var listProps = {
                    ref: function ref(_ref) {
                        return (_this3.apiTokensList = _ref);
                    },
                    api: "/entities/webiny/api-tokens",
                    fields: "*,createdOn",
                    searchFields: "owner,token",
                    connectToRouter: true,
                    perPage: 100
                };

                var systemApiToken = null;
                if (_this3.state.apiToken) {
                    systemApiToken = _react2.default.createElement(
                        Ui.Button,
                        {
                            type: "secondary",
                            align: "right",
                            onClick: function onClick() {
                                return _this3.systemApiToken.show();
                            }
                        },
                        _react2.default.createElement(Ui.Icon, { icon: "fa-key" }),
                        "System API token"
                    );
                }

                return _react2.default.createElement(
                    Ui.ViewSwitcher,
                    null,
                    _react2.default.createElement(
                        Ui.ViewSwitcher.View,
                        { view: "tokensListView", defaultView: true },
                        function(_ref2) {
                            var showView = _ref2.showView;
                            return _react2.default.createElement(
                                Ui.View.List,
                                null,
                                _react2.default.createElement(
                                    Ui.View.Header,
                                    {
                                        title: _this3.i18n("ACL - API Tokens"),
                                        description: _this3.i18n(
                                            "If you want to grant access to your API to 3rd party clients, create an API token for them."
                                        )
                                    },
                                    _react2.default.createElement(Ui.Button, {
                                        type: "primary",
                                        align: "right",
                                        onClick: showView("tokenModalView"),
                                        icon: "icon-plus-circled",
                                        label: _this3.i18n("Create new token")
                                    }),
                                    systemApiToken,
                                    _react2.default.createElement(_SystemApiToken2.default, {
                                        ref: function ref(_ref3) {
                                            return (_this3.systemApiToken = _ref3);
                                        },
                                        token: _this3.state.apiToken,
                                        createToken: showView("tokenModalView")
                                    })
                                ),
                                _react2.default.createElement(
                                    Ui.View.Body,
                                    null,
                                    _react2.default.createElement(
                                        Ui.List,
                                        listProps,
                                        _react2.default.createElement(
                                            Ui.List.FormFilters,
                                            null,
                                            function(_ref4) {
                                                var apply = _ref4.apply;
                                                return _react2.default.createElement(Ui.Input, {
                                                    placeholder: _this3.i18n(
                                                        "Search by owner or token"
                                                    ),
                                                    name: "_searchQuery",
                                                    onEnter: apply()
                                                });
                                            }
                                        ),
                                        _react2.default.createElement(
                                            Table,
                                            null,
                                            _react2.default.createElement(
                                                Table.Row,
                                                null,
                                                _react2.default.createElement(
                                                    Table.Field,
                                                    {
                                                        name: "token",
                                                        align: "left",
                                                        label: _this3.i18n("Token")
                                                    },
                                                    function(_ref5) {
                                                        var data = _ref5.data;
                                                        return _react2.default.createElement(
                                                            Ui.Link,
                                                            {
                                                                onClick: function onClick() {
                                                                    return showView(
                                                                        "tokenModalView"
                                                                    )({ data: data });
                                                                }
                                                            },
                                                            _react2.default.createElement(
                                                                "strong",
                                                                null,
                                                                data.token
                                                            ),
                                                            _react2.default.createElement(
                                                                "br",
                                                                null
                                                            ),
                                                            data.description
                                                        );
                                                    }
                                                ),
                                                _react2.default.createElement(Table.Field, {
                                                    name: "owner",
                                                    align: "left",
                                                    label: _this3.i18n("Owner"),
                                                    sort: "owner"
                                                }),
                                                _react2.default.createElement(Table.TimeAgoField, {
                                                    name: "lastActivity",
                                                    align: "center",
                                                    label: _this3.i18n("Last activity"),
                                                    sort: "lastActivity"
                                                }),
                                                _react2.default.createElement(
                                                    Table.Field,
                                                    {
                                                        name: "requests",
                                                        align: "center",
                                                        label: _this3.i18n("Total Requests"),
                                                        sort: "requests"
                                                    },
                                                    function(_ref6) {
                                                        var data = _ref6.data;
                                                        return _react2.default.createElement(
                                                            Ui.Link,
                                                            {
                                                                route: "ApiLogs.List",
                                                                params: { token: data.id }
                                                            },
                                                            data.requests
                                                        );
                                                    }
                                                ),
                                                _react2.default.createElement(Table.TimeAgoField, {
                                                    name: "createdOn",
                                                    align: "center",
                                                    label: _this3.i18n("Created On"),
                                                    sort: "createdOn"
                                                }),
                                                _react2.default.createElement(Table.ToggleField, {
                                                    name: "enabled",
                                                    label: _this3.i18n("Enabled"),
                                                    sort: "enabled",
                                                    align: "center",
                                                    message: function message(_ref7) {
                                                        var value = _ref7.value;

                                                        if (!value) {
                                                            return _react2.default.createElement(
                                                                "span",
                                                                null,
                                                                _this3.i18n(
                                                                    "This will disable API token and prevent it's bearer from using your API!"
                                                                ),
                                                                _react2.default.createElement(
                                                                    "br",
                                                                    null
                                                                ),
                                                                _this3.i18n(
                                                                    "Are you sure you want to disable it?"
                                                                )
                                                            );
                                                        }
                                                    }
                                                }),
                                                _react2.default.createElement(
                                                    Table.Actions,
                                                    null,
                                                    _react2.default.createElement(
                                                        Table.EditAction,
                                                        {
                                                            label: _this3.i18n("Edit"),
                                                            onClick: showView("tokenModalView")
                                                        }
                                                    ),
                                                    _react2.default.createElement(
                                                        Table.DeleteAction,
                                                        null
                                                    )
                                                )
                                            ),
                                            _react2.default.createElement(Table.Footer, null)
                                        ),
                                        _react2.default.createElement(Ui.List.Pagination, null)
                                    )
                                )
                            );
                        }
                    ),
                    _react2.default.createElement(
                        Ui.ViewSwitcher.View,
                        { view: "tokenModalView", modal: true },
                        function(_ref8) {
                            var showView = _ref8.showView,
                                data = _ref8.data.data;
                            return _react2.default.createElement(
                                _ApiTokenModal2.default,
                                (0, _extends3.default)(
                                    { showView: showView, data: data },
                                    {
                                        refreshTokens: function refreshTokens() {
                                            return _this3.apiTokensList.loadData();
                                        }
                                    }
                                )
                            );
                        }
                    )
                );
            }
        );
    }
};

exports.default = ApiTokensList;
//# sourceMappingURL=ApiTokensList.js.map
