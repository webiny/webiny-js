"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _objectWithoutProperties2 = require("babel-runtime/helpers/objectWithoutProperties");

var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);

var _typeof2 = require("babel-runtime/helpers/typeof");

var _typeof3 = _interopRequireDefault(_typeof2);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _isString2 = require("lodash/isString");

var _isString3 = _interopRequireDefault(_isString2);

var _isFunction2 = require("lodash/isFunction");

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _omit2 = require("lodash/omit");

var _omit3 = _interopRequireDefault(_omit2);

var _clone2 = require("lodash/clone");

var _clone3 = _interopRequireDefault(_clone2);

var _assign2 = require("lodash/assign");

var _assign3 = _interopRequireDefault(_assign2);

var _merge2 = require("lodash/merge");

var _merge3 = _interopRequireDefault(_merge2);

var _mapValues2 = require("lodash/mapValues");

var _mapValues3 = _interopRequireDefault(_mapValues2);

var _keys2 = require("lodash/keys");

var _keys3 = _interopRequireDefault(_keys2);

var _isEmpty2 = require("lodash/isEmpty");

var _isEmpty3 = _interopRequireDefault(_isEmpty2);

var _each2 = require("lodash/each");

var _each3 = _interopRequireDefault(_each2);

var _trimStart2 = require("lodash/trimStart");

var _trimStart3 = _interopRequireDefault(_trimStart2);

var _get2 = require("lodash/get");

var _get3 = _interopRequireDefault(_get2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _invariant = require("invariant");

var _invariant2 = _interopRequireDefault(_invariant);

var _webinyApp = require("webiny-app");

var _Filters = require("./Filters");

var _Filters2 = _interopRequireDefault(_Filters);

var _FormFilters = require("./FormFilters");

var _FormFilters2 = _interopRequireDefault(_FormFilters);

var _Table = require("./Table/Table");

var _Table2 = _interopRequireDefault(_Table);

var _MultiActions = require("./MultiActions");

var _MultiActions2 = _interopRequireDefault(_MultiActions);

var _Pagination = require("./Pagination");

var _Pagination2 = _interopRequireDefault(_Pagination);

var _sortersToString = require("./sortersToString");

var _sortersToString2 = _interopRequireDefault(_sortersToString);

var _ListContainerLoader = require("./../Components/ListContainerLoader");

var _ListContainerLoader2 = _interopRequireDefault(_ListContainerLoader);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var BaseContainer = (function(_React$Component) {
    (0, _inherits3.default)(BaseContainer, _React$Component);

    function BaseContainer(props) {
        (0, _classCallCheck3.default)(this, BaseContainer);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (BaseContainer.__proto__ || Object.getPrototypeOf(BaseContainer)).call(this, props)
        );

        _this.state = {
            loading: false,
            list: [],
            meta: {},
            initialSorters: _this.getInitialSorters(props),
            sorters: {},
            filters: {},
            page: props.page,
            perPage: props.perPage,
            searchQuery: null,
            searchOperator: props.searchOperator || "or",
            searchFields: props.searchFields ? props.searchFields.replace(/\s/g, "") : null,
            selectedRows: []
        };

        _this.filtersElement = null;
        _this.loaderElement = null;
        _this.tableElement = null;
        _this.paginationElement = null;
        _this.multiActionsElement = null;

        [
            "prepareList",
            "tableProps",
            "paginationProps",
            "setSorters",
            "setFilters",
            "setPage",
            "setPerPage",
            "setSearchQuery",
            "getSearchQuery",
            "prepare",
            "recordUpdate",
            "recordDelete",
            "onSelect",
            "getContent"
        ].map(function(m) {
            (0, _invariant2.default)(_this[m], "Method " + m + " does not exist!");
            _this[m] = _this[m].bind(_this);
        });
        return _this;
    }

    (0, _createClass3.default)(BaseContainer, [
        {
            key: "componentWillMount",
            value: function componentWillMount() {
                this.prepare(this.props);
            }
        },
        {
            key: "componentWillReceiveProps",
            value: function componentWillReceiveProps(props) {
                this.prepare(props);
            }
        },
        {
            key: "getInitialSorters",
            value: function getInitialSorters(props) {
                var sorters = {};
                var sortValues = [
                    (0, _get3.default)(props, "sort", ""),
                    (0, _get3.default)(props.query, "_sort", "")
                ];

                sortValues
                    .join(",")
                    .split(",")
                    .map(function(sorter) {
                        if (sorter === "") {
                            return;
                        }
                        if (sorter.startsWith("-")) {
                            sorters[(0, _trimStart3.default)(sorter, "-")] = -1;
                        } else {
                            sorters[sorter] = 1;
                        }
                    });

                return (0, _sortersToString2.default)(sorters);
            }

            /**
             * LOADING METHODS
             */
        },
        {
            key: "showLoading",
            value: function showLoading() {
                this.setState({ loading: true });
            }
        },
        {
            key: "hideLoading",
            value: function hideLoading() {
                this.setState({ loading: false });
            }
        },
        {
            key: "isLoading",
            value: function isLoading() {
                return this.state.loading;
            }
        },
        {
            key: "prepare",
            value: function prepare(props) {
                var state = props.connectToRouter
                    ? this.prepareUsingRouter(props)
                    : this.prepareNotUsingRouter();

                this.setState(state);
            }
        },
        {
            key: "prepareUsingRouter",
            value: function prepareUsingRouter(props) {
                var state = {
                    sorters: {},
                    filters: {}
                };
                var params = _webinyApp.app.router.getQuery();
                var urlSort = params._sort || "";
                urlSort.split(",").map(function(sorter) {
                    if (sorter === "") {
                        return;
                    }
                    if (sorter.startsWith("-")) {
                        state.sorters[(0, _trimStart3.default)(sorter, "-")] = -1;
                    } else {
                        state.sorters[sorter] = 1;
                    }
                });

                // Get limit and page
                state.page = parseInt(params._page || props.page || 1);
                state.perPage = params._perPage || props.perPage || 10;
                state.searchQuery = params._searchQuery || null;

                // Get filters
                (0, _each3.default)(params, function(value, name) {
                    if (!name.startsWith("_")) {
                        state.filters[name] = value;
                    }
                });

                // Add _searchQuery to filters even though it starts with '_' - it's a special system parameter and is in fact a filter
                state.filters._searchQuery = state.searchQuery;

                return state;
            }
        },
        {
            key: "prepareNotUsingRouter",
            value: function prepareNotUsingRouter() {
                return {
                    sorters: {},
                    filters: {}
                };
            }
        },
        {
            key: "setSorters",
            value: function setSorters(sorters) {
                if (this.props.connectToRouter) {
                    this.goToRoute({ _sort: (0, _sortersToString2.default)(sorters), _page: 1 });
                } else {
                    this.setState({ page: 1, sorters: sorters }, this.loadData);
                }

                return this;
            }
        },
        {
            key: "setFilters",
            value: function setFilters(filters) {
                if (this.props.connectToRouter) {
                    // Need to build a new object with null values to unset filters from URL
                    if (
                        (0, _isEmpty3.default)(filters) &&
                        (0, _keys3.default)(this.state.filters)
                    ) {
                        filters = (0, _mapValues3.default)(this.state.filters, function() {
                            return null;
                        });
                    }

                    filters._page = 1;
                    this.goToRoute(filters);
                } else {
                    this.setState({ page: 1, filters: filters }, this.loadData);
                }

                return this;
            }
        },
        {
            key: "setPage",
            value: function setPage(page) {
                if (this.props.connectToRouter) {
                    this.goToRoute({ _page: page });
                } else {
                    this.setState({ page: page }, this.loadData);
                }

                return this;
            }
        },
        {
            key: "setPerPage",
            value: function setPerPage(perPage) {
                if (this.props.connectToRouter) {
                    this.goToRoute({ _perPage: perPage, _page: 1 });
                } else {
                    this.setState({ page: 1, perPage: perPage }, this.loadData);
                }

                return this;
            }
        },
        {
            key: "setSearchQuery",
            value: function setSearchQuery(query) {
                if (this.props.connectToRouter) {
                    this.goToRoute({ _searchQuery: query, _page: 1 });
                } else {
                    this.setState({ page: 1, searchQuery: query }, this.loadData);
                }

                return this;
            }
        },
        {
            key: "goToRoute",
            value: function goToRoute(params) {
                var routeParams = (0, _merge3.default)(
                    {},
                    _webinyApp.app.router.getQuery(),
                    params
                );
                _webinyApp.app.router.goToRoute("current", routeParams);
            }
        },
        {
            key: "getSearchQuery",
            value: function getSearchQuery() {
                return this.state.searchQuery;
            }
        },
        {
            key: "getFilters",
            value: function getFilters() {
                return this.state.filters;
            }

            /* eslint-disable */
        },
        {
            key: "recordUpdate",
            value: function recordUpdate(id, attributes) {
                throw new Error("Implement recordUpdate method in your list container class!");
            }
        },
        {
            key: "recordDelete",
            value: function recordDelete(id) {
                var autoRefresh =
                    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

                throw new Error("Implement recordDelete method in your list container class!");
            }

            /* eslint-enable */
        },
        {
            key: "onSelect",
            value: function onSelect(data) {
                this.setState({ selectedRows: data });
            }
        },
        {
            key: "tableProps",
            value: function tableProps(_tableProps) {
                // Pass relevant props from BaseContainer to Table
                (0, _each3.default)(this.props, function(value, name) {
                    if (
                        (name.startsWith("field") && name !== "fields") ||
                        name.startsWith("action")
                    ) {
                        _tableProps[name] = value;
                    }
                });

                (0, _assign3.default)(_tableProps, {
                    data: (0, _clone3.default)(this.state.list),
                    sorters: this.state.sorters,
                    onSort: this.setSorters,
                    selectedRows: this.state.selectedRows,
                    showEmpty: !this.isLoading()
                });

                return _tableProps;
            }
        },
        {
            key: "paginationProps",
            value: function paginationProps(_paginationProps) {
                (0, _assign3.default)(_paginationProps, {
                    onPageChange: this.setPage,
                    onPerPageChange: this.setPerPage,
                    currentPage: this.state.page,
                    perPage: this.state.perPage,
                    count: (0, _get3.default)(this.state.list, "length", 0),
                    totalCount: (0, _get3.default)(this.state.meta, "totalCount", 0),
                    totalPages: (0, _get3.default)(this.state.meta, "totalPages", 0)
                });

                return _paginationProps;
            }
        },
        {
            key: "multiActionsProps",
            value: function multiActionsProps(_multiActionsProps) {
                (0, _assign3.default)(_multiActionsProps, {
                    data: this.state.selectedRows
                });

                return _multiActionsProps;
            }

            /**
             * @private
             * @param children
             * @param props
             */
        },
        {
            key: "prepareList",
            value: function prepareList(children, listProps) {
                var _this2 = this;

                if (
                    (typeof children === "undefined"
                        ? "undefined"
                        : (0, _typeof3.default)(children)) !== "object" ||
                    children === null
                ) {
                    return;
                }

                _react2.default.Children.map(
                    children,
                    function(child) {
                        if (
                            (0, _webinyApp.isElementOfType)(child, _Filters2.default) ||
                            (0, _webinyApp.isElementOfType)(child, _FormFilters2.default)
                        ) {
                            // Need to omit fields that are not actual filters
                            _this2.filtersElement = _react2.default.cloneElement(child, {
                                filters: _this2.state.filters,
                                onFilter: _this2.setFilters
                            });
                        }

                        var props = (0, _omit3.default)(child.props, ["children", "key", "ref"]);
                        if ((0, _webinyApp.isElementOfType)(child, _Table2.default)) {
                            _this2.tableElement = _react2.default.cloneElement(
                                child,
                                Object.assign({}, _this2.tableProps(props), listProps),
                                child.props.children
                            );
                        }

                        if ((0, _webinyApp.isElementOfType)(child, _Pagination2.default)) {
                            _this2.paginationElement = _react2.default.cloneElement(
                                child,
                                Object.assign({}, _this2.paginationProps(props), listProps),
                                child.props.children
                            );
                        }

                        if ((0, _webinyApp.isElementOfType)(child, _ListContainerLoader2.default)) {
                            _this2.loaderElement = _react2.default.cloneElement(
                                child,
                                { show: _this2.isLoading() },
                                child.props.children
                            );
                        }

                        if ((0, _webinyApp.isElementOfType)(child, _MultiActions2.default)) {
                            _this2.multiActionsElement = _react2.default.cloneElement(
                                child,
                                Object.assign({}, _this2.multiActionsProps(props), listProps),
                                child.props.children
                            );
                        }
                    },
                    this
                );

                // If MultiActions are present, pass an onSelect callback to Table which will tell Table to allow selection
                // and execute onSelect callback when selection is changed
                if (this.multiActionsElement) {
                    this.tableElement = _react2.default.cloneElement(this.tableElement, {
                        onSelect: this.onSelect
                    });
                }

                return {
                    filters: this.filtersElement,
                    table: this.tableElement,
                    pagination: this.paginationElement,
                    multiActions: this.multiActionsElement,
                    loader: this.loaderElement
                        ? this.loaderElement
                        : _react2.default.createElement(_ListContainerLoader2.default, {
                              show: this.isLoading()
                          })
                };
            }

            /**
             * Get ApiContainer content
             * @returns {*}
             */
        },
        {
            key: "getContent",
            value: function getContent(children) {
                if ((0, _isFunction3.default)(children)) {
                    var params = {
                        list: this.state.list,
                        meta: this.state.meta,
                        $this: this
                    };

                    var content = children.call(this, params);

                    // NOTE: The following hacky "if" is needed because React does not yet support returning of multiple elements.
                    // And since BaseContainer only parses first level of children, if you return some kind of a wrapper while using a layout
                    // we need to get the list elements from the wrapper element (its children).
                    // NOTE: When layout is not defined (or set to null/false) - this will not be executed!
                    // TODO: add support for returning a Table (currently not working without a wrapper)
                    if (
                        this.props.layout &&
                        _react2.default.Children.count(content) === 1 &&
                        (0, _isString3.default)(content.type)
                    ) {
                        return content.props.children;
                    }

                    return content;
                }

                return _react2.default.Children.toArray(children);
            }
        },
        {
            key: "render",
            value: function render() {
                var _this3 = this;

                var _props = this.props,
                    children = _props.children,
                    props = (0, _objectWithoutProperties3.default)(_props, ["children"]);

                return _react2.default.cloneElement(
                    children,
                    Object.assign({}, props, this.state, {
                        setState: function setState() {
                            return _this3.setState.apply(_this3, arguments);
                        },
                        prepare: function prepare(props) {
                            return _this3.prepare(props);
                        },
                        prepareList: this.prepareList.bind(this),
                        getContent: function getContent(children) {
                            return _this3.getContent(children);
                        },
                        getListElements: function getListElements(content) {
                            return _this3.prepareList(content);
                        },
                        showLoading: this.showLoading.bind(this)
                    })
                );
            }
        }
    ]);
    return BaseContainer;
})(_react2.default.Component);

BaseContainer.defaultProps = {
    connectToRouter: false,
    trackLastUsedParameters: true,
    page: 1,
    perPage: 10
};

exports.default = BaseContainer;
//# sourceMappingURL=BaseContainer.js.map
