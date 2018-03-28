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

var _noop2 = require("lodash/noop");

var _noop3 = _interopRequireDefault(_noop2);

var _assign2 = require("lodash/assign");

var _assign3 = _interopRequireDefault(_assign2);

var _pick2 = require("lodash/pick");

var _pick3 = _interopRequireDefault(_pick2);

var _isEqual2 = require("lodash/isEqual");

var _isEqual3 = _interopRequireDefault(_isEqual2);

var _isNumber2 = require("lodash/isNumber");

var _isNumber3 = _interopRequireDefault(_isNumber2);

var _get2 = require("lodash/get");

var _get3 = _interopRequireDefault(_get2);

var _templateObject = (0, _taggedTemplateLiteral3.default)(
    ["That didn't go as expected..."],
    ["That didn\\'t go as expected..."]
);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _BaseContainer = require("./BaseContainer");

var _BaseContainer2 = _interopRequireDefault(_BaseContainer);

var _sortersToString = require("./sortersToString");

var _sortersToString2 = _interopRequireDefault(_sortersToString);

var _styles = require("./../styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = _webinyApp.i18n.namespace("Webiny.Ui.List.ApiContainer");

var ApiContainer = (function(_React$Component) {
    (0, _inherits3.default)(ApiContainer, _React$Component);

    function ApiContainer(props) {
        (0, _classCallCheck3.default)(this, ApiContainer);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (ApiContainer.__proto__ || Object.getPrototypeOf(ApiContainer)).call(this, props)
        );

        _this.state = {
            initiallyLoaded: false,
            routerParams: null
        };

        _this.mounted = false;

        ["loadData", "recordUpdate", "recordDelete"].map(function(m) {
            return (_this[m] = _this[m].bind(_this));
        });
        return _this;
    }

    (0, _createClass3.default)(ApiContainer, [
        {
            key: "componentWillMount",
            value: function componentWillMount() {
                var _this2 = this;

                this.mounted = true;

                if (this.props.autoLoad) {
                    this.loadData().then(function(data) {
                        if (!_this2.mounted) {
                            return;
                        }
                        _this2.setState({ initiallyLoaded: true });
                        _this2.props.onInitialLoad({
                            list: (0, _get3.default)(data, "list"),
                            meta: (0, _get3.default)(data, "meta")
                        });
                    });
                }
            }
        },
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                var _this3 = this;

                if (this.props.autoRefresh && (0, _isNumber3.default)(this.props.autoRefresh)) {
                    this.autoRefresh = setInterval(function() {
                        return _this3.loadData(null, false);
                    }, 1000 * this.props.autoRefresh);
                }
            }
        },
        {
            key: "componentWillUnmount",
            value: function componentWillUnmount() {
                this.mounted = false;
                clearInterval(this.autoRefresh);
                if (this.request) {
                    // TODO: this.cancelRequest();
                }
            }
        },
        {
            key: "componentWillReceiveProps",
            value: function componentWillReceiveProps(props) {
                var _this4 = this;

                var shouldLoad = false;

                var propKeys = [
                    "sorters",
                    "filters",
                    "perPage",
                    "page",
                    "searchQuery",
                    "searchFields",
                    "searchOperator"
                ];
                if (
                    !(0, _isEqual3.default)(
                        (0, _pick3.default)(props, propKeys),
                        (0, _pick3.default)(this.props, propKeys)
                    )
                ) {
                    shouldLoad = true;
                }

                if (this.props.autoLoad && shouldLoad) {
                    this.loadData(props).then(function(data) {
                        _this4.props.onLoad({
                            list: (0, _get3.default)(data, "list"),
                            meta: (0, _get3.default)(data, "meta")
                        });
                    });
                }
            }
        },
        {
            key: "loadData",
            value: function loadData() {
                var _this5 = this;

                var props =
                    arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
                var showLoading =
                    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

                if (!props) {
                    props = this.props;
                }

                if (this.request) {
                    // TODO: this.cancelRequest();
                }

                var query = (0, _assign3.default)(
                    {},
                    props.query,
                    {
                        _sort: Object.keys(props.sorters).length
                            ? (0, _sortersToString2.default)(props.sorters)
                            : props.initialSorters,
                        _perPage: props.perPage,
                        _page: props.page,
                        _searchQuery: props.searchQuery,
                        _searchFields: props.searchFields,
                        _searchOperator: props.searchOperator
                    },
                    props.filters
                );

                if (showLoading) {
                    this.props.showLoading();
                }

                this.request = props.api.request({ params: query }).then(function(response) {
                    var data = response.data.data;

                    if (!response.data.code && props.prepareLoadedData) {
                        data.list = props.prepareLoadedData({
                            list: data.list,
                            meta: data.meta,
                            $this: _this5
                        });
                    }

                    if (response.data.code) {
                        _webinyApp.app.services
                            .get("growler")
                            .danger(response.data.message, t(_templateObject), true);
                    }

                    if (_this5.mounted) {
                        props.setState(
                            Object.assign({ loading: false }, data, { selectedRows: [] })
                        );
                    }

                    return data;
                });

                return this.request;
            }
        },
        {
            key: "recordUpdate",
            value: function recordUpdate(id, attributes) {
                var _this6 = this;

                return this.props.api
                    .patch(this.props.api.defaults.url + "/" + id, attributes)
                    .then(function(response) {
                        if (!response.data.code) {
                            _this6.loadData();
                        } else {
                            _webinyApp.app.services
                                .get("growler")
                                .danger(response.data.message, t(_templateObject), true);
                        }
                        return response;
                    });
            }
        },
        {
            key: "recordDelete",
            value: function recordDelete(id) {
                var _this7 = this;

                var autoRefresh =
                    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

                return this.props.api
                    .delete(this.props.api.defaults.url + "/" + id)
                    .then(function(response) {
                        if (!response.data.code && autoRefresh) {
                            _this7.loadData();
                        } else {
                            _webinyApp.app.services
                                .get("growler")
                                .danger(response.data.message, t(_templateObject), true);
                        }
                        return response;
                    });
            }
        },
        {
            key: "render",
            value: function render() {
                var content = this.props.getContent(this.props.children);

                if (!content) {
                    return null;
                }

                if (!this.props.layout) {
                    return _react2.default.createElement(
                        "webiny-list",
                        null,
                        _react2.default.Children.map(content, this.prepareElement, this)
                    );
                }

                var layoutProps = Object.assign(
                    {},
                    this.props.prepareList(content, {
                        actions: {
                            update: this.recordUpdate,
                            delete: this.recordDelete,
                            reload: this.loadData,
                            api: this.props.api
                        }
                    }),
                    {
                        list: this.state.list,
                        meta: this.state.meta,
                        container: this
                    }
                );

                return this.props.layout.call(this, layoutProps);
            }
        }
    ]);
    return ApiContainer;
})(_react2.default.Component);

ApiContainer.defaultProps = {
    onInitialLoad: _noop3.default,
    onLoad: _noop3.default,
    autoLoad: true,
    autoRefresh: null,
    prepareLoadedData: null,
    layout: function layout(_ref) {
        var filters = _ref.filters,
            table = _ref.table,
            pagination = _ref.pagination,
            multiActions = _ref.multiActions,
            loader = _ref.loader;
        var _props = this.props,
            Grid = _props.Grid,
            styles = _props.styles;

        return _react2.default.createElement(
            "webiny-list-layout",
            null,
            loader,
            filters,
            table,
            _react2.default.createElement(
                Grid.Row,
                { className: styles.footer },
                _react2.default.createElement(
                    Grid.Col,
                    { sm: 4, className: styles.multiAction },
                    multiActions
                ),
                _react2.default.createElement(
                    Grid.Col,
                    { sm: 8, className: styles.paginationWrapper },
                    pagination
                )
            )
        );
    }
};

exports.default = (0, _webinyApp.createComponent)(
    [ApiContainer, _BaseContainer2.default, _webinyApp.ApiComponent],
    { modules: ["Grid"], styles: _styles2.default }
);
//# sourceMappingURL=ApiContainer.js.map
