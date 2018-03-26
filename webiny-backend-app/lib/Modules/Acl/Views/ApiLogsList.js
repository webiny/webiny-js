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

var _get2 = require("babel-runtime/helpers/get");

var _get3 = _interopRequireDefault(_get2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _webinyClient = require("webiny-client");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @i18n.namespace Webiny.Backend.Acl.ApiLogsList
 */
var ApiLogsList = (function(_Webiny$Ui$View) {
    (0, _inherits3.default)(ApiLogsList, _Webiny$Ui$View);

    function ApiLogsList(props) {
        (0, _classCallCheck3.default)(this, ApiLogsList);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (ApiLogsList.__proto__ || Object.getPrototypeOf(ApiLogsList)).call(this, props)
        );

        _this.state = {
            token: null,
            tokens: []
        };

        _this.systemToken = {
            id: "system",
            description: "System Token"
        };

        _this.incognitoRequests = {
            id: "incognito",
            description: "Incognito Requests"
        };
        return _this;
    }

    (0, _createClass3.default)(ApiLogsList, [
        {
            key: "componentWillMount",
            value: function componentWillMount() {
                (0, _get3.default)(
                    ApiLogsList.prototype.__proto__ || Object.getPrototypeOf(ApiLogsList.prototype),
                    "componentWillMount",
                    this
                ).call(this);

                // Set requested token data to render view title
                this.setToken(_webinyClient.Webiny.Router.getParams("token"));

                this.prepareTokenOptions();
            }
        },
        {
            key: "componentWillReceiveProps",
            value: function componentWillReceiveProps(props) {
                (0, _get3.default)(
                    ApiLogsList.prototype.__proto__ || Object.getPrototypeOf(ApiLogsList.prototype),
                    "componentWillReceiveProps",
                    this
                ).call(this, props);
                this.setToken(_webinyClient.Webiny.Router.getParams("token"));
            }
        },
        {
            key: "setToken",
            value: function setToken(token) {
                if (!token) {
                    return this.setState({ token: null });
                }

                if (token === "system") {
                    this.setState({ token: this.systemToken });
                } else if (token === "incognito") {
                    this.setState({ token: this.incognitoRequests });
                } else {
                    this.loadToken(token);
                }
            }
        },
        {
            key: "loadToken",
            value: function loadToken(id) {
                var _this2 = this;

                return new _webinyClient.Webiny.Api.Endpoint("/entities/webiny/api-tokens")
                    .get(id, { _fields: "owner,description" })
                    .then(function(apiResponse) {
                        _this2.setState({ token: apiResponse.getData("entity") });
                    });
            }
        },
        {
            key: "prepareTokenOptions",
            value: function prepareTokenOptions() {
                var _this3 = this;

                var options = [this.incognitoRequests];
                // Check if current user has permissions to view system token and its logs
                return new _webinyClient.Webiny.Api.Endpoint("/services/webiny/acl")
                    .get("token")
                    .then(function(apiResponse) {
                        if (!apiResponse.isError()) {
                            // Great, the user can view system token
                            options.push(_this3.systemToken);
                        }

                        // Load other API tokens
                        return new _webinyClient.Webiny.Api.Endpoint("/entities/webiny/api-tokens")
                            .get("/", { _fields: "id,owner,description" })
                            .then(function(apiResponse) {
                                if (!apiResponse.isError()) {
                                    apiResponse.getData("list").map(function(token) {
                                        return options.push(token);
                                    });
                                }
                                _this3.setState({ tokens: options });
                            });
                    });
            }
        },
        {
            key: "renderUrlField",
            value: function renderUrlField(row) {
                var user = row.createdBy,
                    token = row.token,
                    request = row.request,
                    method = row.method;

                var userLabel = null;
                var tokenLabel = null;

                var Ui = this.props.Ui;

                if (!_lodash2.default.isNil(token)) {
                    if (token === "system") {
                        tokenLabel = _react2.default.createElement(
                            Ui.Label,
                            { type: "error", inline: true },
                            "System token"
                        );
                    } else {
                        tokenLabel = _react2.default.createElement(
                            Ui.Label,
                            { type: "success", inline: true },
                            token.description,
                            " (",
                            token.owner,
                            ")"
                        );
                    }
                }

                if (!_lodash2.default.isNil(user) && !tokenLabel) {
                    userLabel = _react2.default.createElement(
                        Ui.Label,
                        { type: "default", inline: true },
                        user.firstName,
                        " ",
                        user.lastName,
                        " (",
                        user.email,
                        ")"
                    );
                }

                if (!user && !token) {
                    tokenLabel = _react2.default.createElement(
                        Ui.Label,
                        { type: "default", inline: true },
                        "Incognito"
                    );
                }

                return _react2.default.createElement(
                    "field",
                    null,
                    request.url,
                    _react2.default.createElement("br", null),
                    _react2.default.createElement(Ui.Label, { type: "info", inline: true }, method),
                    userLabel,
                    tokenLabel
                );
            }
        },
        {
            key: "renderTokenOption",
            value: function renderTokenOption(_ref) {
                var option = _ref.option;

                var desc = option.data.description;
                if (option.data.owner) {
                    desc += " (" + option.data.owner + ")";
                }
                return desc;
            }
        }
    ]);
    return ApiLogsList;
})(_webinyClient.Webiny.Ui.View);

ApiLogsList.defaultProps = {
    renderer: function renderer() {
        var _this4 = this;

        var listProps = {
            api: "/entities/webiny/api-logs",
            fields:
                "*,createdOn,createdBy[id,firstName,lastName,email],token[id,description,owner]",
            query: {
                token: _webinyClient.Webiny.Router.getParams("token")
            },
            sort: "-createdOn",
            searchFields: "request.method,request.url",
            layout: null,
            connectToRouter: true
        };

        var Ui = this.props.Ui;

        var title = null;
        if (this.state.token) {
            title = this.state.token.description;
            if (this.state.token.owner) {
                title += " (" + this.state.token.owner + ")";
            }
        }

        return _react2.default.createElement(
            Ui.View.List,
            null,
            _react2.default.createElement(Ui.View.Header, {
                title: this.state.token
                    ? this.i18n("ACL - API Logs: {title}", { title: title })
                    : this.i18n("ACL - API Logs"),
                description: this.i18n("Here you can view all API request logs.")
            }),
            _react2.default.createElement(
                Ui.View.Body,
                null,
                _react2.default.createElement(Ui.List, listProps, function(_ref2) {
                    var list = _ref2.list;

                    return _react2.default.createElement(
                        Ui.Grid.Row,
                        null,
                        _react2.default.createElement(
                            Ui.Grid.Col,
                            { all: 12 },
                            _react2.default.createElement(Ui.List.FormFilters, null, function(
                                _ref3
                            ) {
                                var apply = _ref3.apply;
                                return _react2.default.createElement(
                                    Ui.Grid.Row,
                                    null,
                                    _react2.default.createElement(
                                        Ui.Grid.Col,
                                        { all: 3 },
                                        _react2.default.createElement(Ui.Input, {
                                            name: "_searchQuery",
                                            placeholder: _this4.i18n("Search by method or URL"),
                                            onEnter: apply()
                                        })
                                    ),
                                    _react2.default.createElement(
                                        Ui.Grid.Col,
                                        { all: 3 },
                                        _react2.default.createElement(Ui.Select, {
                                            api: "/entities/webiny/api-logs/methods",
                                            name: "method",
                                            placeholder: _this4.i18n("Filter by HTTP method"),
                                            allowClear: true,
                                            onChange: apply()
                                        })
                                    ),
                                    _react2.default.createElement(
                                        Ui.Grid.Col,
                                        { all: 3 },
                                        _react2.default.createElement(Ui.Select, {
                                            options: _this4.state.tokens,
                                            optionRenderer: _this4.renderTokenOption,
                                            selectedRenderer: _this4.renderTokenOption,
                                            name: "token",
                                            placeholder: _this4.i18n("Filter by token"),
                                            allowClear: true,
                                            onChange: apply()
                                        })
                                    ),
                                    _react2.default.createElement(
                                        Ui.Grid.Col,
                                        { all: 3 },
                                        _react2.default.createElement(Ui.Search, {
                                            api: "/entities/webiny/users",
                                            fields: "id,firstName,lastName,email",
                                            searchFields: "firstName,lastName,email",
                                            optionRenderer: function optionRenderer(_ref4) {
                                                var item = _ref4.option.data;
                                                return (
                                                    item.firstName +
                                                    " " +
                                                    item.lastName +
                                                    " (" +
                                                    item.email +
                                                    ")"
                                                );
                                            },
                                            selectedRenderer: function selectedRenderer(_ref5) {
                                                var item = _ref5.option.data;
                                                return (
                                                    item.firstName +
                                                    " " +
                                                    item.lastName +
                                                    " (" +
                                                    item.email +
                                                    ")"
                                                );
                                            },
                                            name: "createdBy",
                                            placeholder: _this4.i18n("Filter by user"),
                                            onChange: apply()
                                        })
                                    )
                                );
                            })
                        ),
                        _react2.default.createElement(
                            Ui.Grid.Col,
                            { all: 12 },
                            _react2.default.createElement(Ui.List.Loader, null),
                            _react2.default.createElement(Ui.List.Table.Empty, {
                                renderIf: !list.length
                            }),
                            _react2.default.createElement(
                                Ui.ExpandableList,
                                null,
                                list.map(function(row) {
                                    return _react2.default.createElement(
                                        Ui.ExpandableList.Row,
                                        { key: row.id },
                                        _react2.default.createElement(
                                            Ui.ExpandableList.Field,
                                            { all: 9, name: "URL", className: "text-left" },
                                            _this4.renderUrlField(row)
                                        ),
                                        _react2.default.createElement(
                                            Ui.ExpandableList.Field,
                                            {
                                                all: 3,
                                                name: "Created On",
                                                className: "text-center"
                                            },
                                            _react2.default.createElement(
                                                "span",
                                                null,
                                                _react2.default.createElement(Ui.Filters.TimeAgo, {
                                                    value: row.createdOn
                                                }),
                                                _react2.default.createElement("br", null),
                                                _react2.default.createElement(Ui.Filters.DateTime, {
                                                    value: row.createdOn
                                                })
                                            )
                                        ),
                                        _react2.default.createElement(
                                            Ui.ExpandableList.RowDetailsList,
                                            { title: row.request.url },
                                            _react2.default.createElement(
                                                Ui.CodeHighlight,
                                                { language: "json" },
                                                JSON.stringify(row.request, null, 2)
                                            )
                                        )
                                    );
                                })
                            )
                        ),
                        _react2.default.createElement(
                            Ui.Grid.Col,
                            { all: 12 },
                            _react2.default.createElement(Ui.List.Pagination, null)
                        )
                    );
                })
            )
        );
    }
};

exports.default = _webinyClient.Webiny.createComponent(ApiLogsList, {
    modulesProp: "Ui",
    modules: [
        "View",
        "Link",
        "List",
        "Grid",
        "Input",
        "ExpandableList",
        "Label",
        "CodeHighlight",
        "Select",
        "Search",
        "Filters"
    ]
});
//# sourceMappingURL=ApiLogsList.js.map
