"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends2 = require("babel-runtime/helpers/extends");

var _extends3 = _interopRequireDefault(_extends2);

var _toConsumableArray2 = require("babel-runtime/helpers/toConsumableArray");

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _pick2 = require("lodash/pick");

var _pick3 = _interopRequireDefault(_pick2);

var _uniq2 = require("lodash/uniq");

var _uniq3 = _interopRequireDefault(_uniq2);

var _findIndex2 = require("lodash/findIndex");

var _findIndex3 = _interopRequireDefault(_findIndex2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _PageManager = require("./PageManager");

var _PageManager2 = _interopRequireDefault(_PageManager);

var _PageManagerContext = require("./context/PageManagerContext");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var createdBy = "createdBy { ... on SecurityUser { firstName lastName } }";
var fields =
    "\n    id title slug status createdOn pinned\n    category { title }\n    revisions { id name slug title active content { id type origin data settings } savedOn createdOn " +
    createdBy +
    "}\n    " +
    createdBy +
    "\n";

var PageManagerContainer = (function(_React$Component) {
    (0, _inherits3.default)(PageManagerContainer, _React$Component);

    function PageManagerContainer() {
        (0, _classCallCheck3.default)(this, PageManagerContainer);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (PageManagerContainer.__proto__ || Object.getPrototypeOf(PageManagerContainer)).call(
                this
            )
        );

        _this.state = {};
        _this.currentList = [];
        _this.lastLoadedPage = 0;
        _this.updatePage = _this.updatePage.bind(_this);
        _this.reloadPage = _this.reloadPage.bind(_this);
        _this.moveToTrash = _this.moveToTrash.bind(_this);
        _this.removePageFromList = _this.removePageFromList.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(PageManagerContainer, [
        {
            key: "updateRevision",
            value: function updateRevision(id, data) {
                var updateRevision = _webinyApp.app.graphql.generateUpdate("CmsRevision", "id");

                return updateRevision({ variables: { id: id, data: data } }).catch(function(error) {
                    _webinyApp.app.services.get("growler").warning(error.message);
                });
            }
        },
        {
            key: "reloadPage",
            value: function reloadPage(id) {
                var _this2 = this;

                var getPage = _webinyApp.app.graphql.generateGet("CmsPage", fields);

                return getPage({ variables: { id: id } }).then(function(_ref) {
                    var data = _ref.data;

                    var index = (0, _findIndex3.default)(_this2.currentList, { id: id });
                    _this2.currentList.splice(index, 1, data);
                    _this2.setState({ ts: Date.now() });
                });
            }
        },
        {
            key: "moveToTrash",
            value: function moveToTrash(id) {
                return this.updatePage(id, { status: "trash" });
            }
        },
        {
            key: "updatePage",
            value: function updatePage(id, data) {
                var _this3 = this;

                return _webinyApp.app.graphql
                    .generateUpdate("CmsPage", fields)({ variables: { id: id, data: data } })
                    .then(function(_ref2) {
                        var data = _ref2.data;

                        var index = (0, _findIndex3.default)(_this3.currentList, { id: id });
                        _this3.currentList.splice(index, 1, data);
                        _this3.setState({ ts: Date.now() });
                    });
            }
        },
        {
            key: "removePageFromList",
            value: function removePageFromList(id) {
                var index = (0, _findIndex3.default)(this.currentList, { id: id });
                this.currentList.splice(index, 1);
                this.setState({ ts: Date.now() });
            }
        },
        {
            key: "combineList",
            value: function combineList(list) {
                this.currentList = (0, _uniq3.default)(
                    [].concat(
                        (0, _toConsumableArray3.default)(this.currentList),
                        (0, _toConsumableArray3.default)(list)
                    )
                );

                return this.currentList;
            }
        },
        {
            key: "render",
            value: function render() {
                var _this4 = this;

                var ListData = this.props.modules.ListData;

                return _react2.default.createElement(
                    ListData,
                    {
                        entity: "CmsPage",
                        search: { fields: ["title", "slug"] },
                        sort: { savedOn: -1 },
                        perPage: 7,
                        fields: fields
                    },
                    function(props) {
                        var list = props.list,
                            meta = props.meta,
                            page = props.page;

                        if (!props.loading) {
                            if (page > _this4.lastLoadedPage) {
                                list = _this4.combineList(list);
                                _this4.lastLoadedPage = page;
                            } else {
                                list = _this4.currentList;
                            }
                        }

                        var context = Object.assign({}, props, {
                            list: list,
                            hasMore: meta.totalPages > page,
                            loadMore: function loadMore() {
                                return props.setPage(page + 1);
                            },
                            updateRevision: _this4.updateRevision,
                            updatePage: _this4.updatePage,
                            reloadPage: _this4.reloadPage,
                            moveToTrash: _this4.moveToTrash
                        });

                        return _react2.default.createElement(
                            _PageManagerContext.PageManagerProvider,
                            { value: context },
                            _react2.default.createElement(
                                _PageManager2.default,
                                (0, _extends3.default)(
                                    {},
                                    (0, _pick3.default)(context, [
                                        "list",
                                        "meta",
                                        "page",
                                        "filter",
                                        "setSearchQuery",
                                        "search",
                                        "hasMore",
                                        "loadMore",
                                        "moveToTrash",
                                        "updatePage"
                                    ]),
                                    {
                                        setSearchQuery: function setSearchQuery(query) {
                                            _this4.lastLoadedPage = 0;
                                            _this4.currentList = [];
                                            context.setSearchQuery(query);
                                        },
                                        setFilter: function setFilter(filter) {
                                            _this4.lastLoadedPage = 0;
                                            _this4.currentList = [];
                                            context.setFilter(filter);
                                        },
                                        removePageFromList: _this4.removePageFromList
                                    }
                                )
                            )
                        );
                    }
                );
            }
        }
    ]);
    return PageManagerContainer;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(PageManagerContainer, { modules: ["ListData"] });
//# sourceMappingURL=PageManagerContainer.js.map
