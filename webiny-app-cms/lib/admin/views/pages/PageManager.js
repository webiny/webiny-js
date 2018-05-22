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

var _find2 = require("lodash/find");

var _find3 = _interopRequireDefault(_find2);

var _templateObject = (0, _taggedTemplateLiteral3.default)(["CMS / Pages"], ["CMS / Pages"]),
    _templateObject2 = (0, _taggedTemplateLiteral3.default)(
        ["Your list of pages. Click the button on the right to create a new page."],
        ["Your list of pages. Click the button on the right to create a new page."]
    ),
    _templateObject3 = (0, _taggedTemplateLiteral3.default)(
        ["Create new page"],
        ["Create new page"]
    );

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _reactInfiniteScroller = require("react-infinite-scroller");

var _reactInfiniteScroller2 = _interopRequireDefault(_reactInfiniteScroller);

var _PageDetailsContext = require("./context/PageDetailsContext");

var _PageFilter = require("./components/PageFilter");

var _PageFilter2 = _interopRequireDefault(_PageFilter);

var _PageListControls = require("./components/PageListControls");

var _PageListControls2 = _interopRequireDefault(_PageListControls);

var _PageList = require("./components/PageList");

var _PageList2 = _interopRequireDefault(_PageList);

var _PageDetails = require("./components/PageDetails");

var _PageDetails2 = _interopRequireDefault(_PageDetails);

var _CreatePageDialog = require("./components/CreatePageDialog");

var _CreatePageDialog2 = _interopRequireDefault(_CreatePageDialog);

var _PageManager = require("./PageManager.scss?prefix=Webiny_CMS_PageManager");

var _PageManager2 = _interopRequireDefault(_PageManager);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = _webinyApp.i18n.namespace("Cms.Admin.Views.PageManager");

var PageManager = (function(_React$Component) {
    (0, _inherits3.default)(PageManager, _React$Component);

    function PageManager() {
        (0, _classCallCheck3.default)(this, PageManager);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (PageManager.__proto__ || Object.getPrototypeOf(PageManager)).call(this)
        );

        _this.state = {
            page: null,
            category: null
        };
        return _this;
    }

    (0, _createClass3.default)(PageManager, [
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                var _props$modules = this.props.modules,
                    Modal = _props$modules.Modal,
                    ViewSwitcher = _props$modules.ViewSwitcher,
                    View = _props$modules.View,
                    Link = _props$modules.Link,
                    Icon = _props$modules.Icon,
                    Grid = _props$modules.Grid,
                    Scrollbar = _props$modules.Scrollbar;
                var _props = this.props,
                    list = _props.list,
                    hasMore = _props.hasMore,
                    setSearchQuery = _props.setSearchQuery,
                    setFilter = _props.setFilter,
                    filter = _props.filter,
                    search = _props.search,
                    loadMore = _props.loadMore,
                    moveToTrash = _props.moveToTrash,
                    updatePage = _props.updatePage,
                    removePageFromList = _props.removePageFromList;

                var page = (0, _find3.default)(list, { id: this.state.page });

                return _react2.default.createElement(
                    View.List,
                    null,
                    _react2.default.createElement(
                        View.Header,
                        {
                            title: t(_templateObject),
                            description: t(_templateObject2)
                        },
                        _react2.default.createElement(
                            Link,
                            {
                                type: "primary",
                                align: "right",
                                onClick: function onClick() {
                                    return _this2.createModal.show();
                                }
                            },
                            _react2.default.createElement(Icon, { icon: ["fa", "plus-circle"] }),
                            " ",
                            t(_templateObject3)
                        ),
                        _react2.default.createElement(_CreatePageDialog2.default, {
                            onReady: function onReady(ref) {
                                return (_this2.createModal = ref);
                            }
                        })
                    ),
                    _react2.default.createElement(
                        View.Body,
                        { noPadding: true, noColor: true },
                        _react2.default.createElement(
                            ViewSwitcher,
                            {
                                onReady: function onReady(actions) {
                                    return (_this2.viewSwitcher = actions);
                                }
                            },
                            _react2.default.createElement(
                                ViewSwitcher.View,
                                { name: "manager", defaultView: true },
                                function() {
                                    return _react2.default.createElement(
                                        _react.Fragment,
                                        null,
                                        _react2.default.createElement(
                                            Grid.Row,
                                            null,
                                            _react2.default.createElement(
                                                Grid.Col,
                                                {
                                                    all: 12,
                                                    className: _PageManager2.default.noPadding
                                                },
                                                _react2.default.createElement(
                                                    _PageFilter2.default,
                                                    {
                                                        filter: filter,
                                                        query: search.query,
                                                        setSearchQuery: setSearchQuery,
                                                        setFilter: setFilter
                                                    }
                                                )
                                            )
                                        ),
                                        _react2.default.createElement(
                                            Grid.Row,
                                            { className: _PageManager2.default.listLayout },
                                            _react2.default.createElement(
                                                Grid.Col,
                                                {
                                                    all: 4,
                                                    className: _PageManager2.default.sidebar
                                                },
                                                _react2.default.createElement(
                                                    "div",
                                                    {
                                                        className:
                                                            _PageManager2.default.sidebarHeader
                                                    },
                                                    _react2.default.createElement(
                                                        _PageListControls2.default,
                                                        {
                                                            category: filter.category,
                                                            onCategory: function onCategory(cat) {
                                                                return setFilter({ category: cat });
                                                            }
                                                        }
                                                    )
                                                ),
                                                _react2.default.createElement(
                                                    Scrollbar,
                                                    { style: { height: 800 } },
                                                    _react2.default.createElement(
                                                        _reactInfiniteScroller2.default,
                                                        {
                                                            initialLoad: false,
                                                            loadMore: loadMore,
                                                            hasMore: hasMore,
                                                            useWindow: false,
                                                            threshold: 100
                                                        },
                                                        _react2.default.createElement(
                                                            _PageList2.default,
                                                            {
                                                                pages: list,
                                                                onPageClick: function onPageClick(
                                                                    _ref
                                                                ) {
                                                                    var id = _ref.id;
                                                                    return _this2.setState({
                                                                        page: id
                                                                    });
                                                                }
                                                            }
                                                        )
                                                    )
                                                )
                                            ),
                                            _react2.default.createElement(
                                                Grid.Col,
                                                {
                                                    all: 8,
                                                    className: _PageManager2.default.noPadding
                                                },
                                                _react2.default.createElement(
                                                    _PageDetailsContext.PageDetailsProvider,
                                                    { value: { page: page } },
                                                    _react2.default.createElement(
                                                        _PageDetails2.default,
                                                        {
                                                            togglePublished: function togglePublished() {
                                                                return updatePage(page.id, {
                                                                    status:
                                                                        page.status === "draft"
                                                                            ? "published"
                                                                            : "draft"
                                                                }).then(function() {
                                                                    removePageFromList(page.id);
                                                                    _this2.setState({ page: null });
                                                                });
                                                            },
                                                            togglePinned: function togglePinned() {
                                                                return updatePage(page.id, {
                                                                    pinned: !page.pinned
                                                                }).then(function() {
                                                                    removePageFromList(page.id);
                                                                    _this2.setState({ page: null });
                                                                });
                                                            },
                                                            moveToDrafts: function moveToDrafts() {
                                                                return updatePage(page.id, {
                                                                    status: "draft"
                                                                }).then(function() {
                                                                    removePageFromList(page.id);
                                                                    _this2.setState({ page: null });
                                                                });
                                                            },
                                                            moveToTrash: function moveToTrash() {
                                                                return _this2.viewSwitcher.showView(
                                                                    "moveToTrash"
                                                                )(page);
                                                            },
                                                            page: page
                                                        }
                                                    )
                                                )
                                            )
                                        )
                                    );
                                }
                            ),
                            _react2.default.createElement(
                                ViewSwitcher.View,
                                { name: "moveToTrash", modal: true },
                                function(_ref2) {
                                    var data = _ref2.data;

                                    return _react2.default.createElement(Modal.Confirmation, {
                                        name: "moveToTrashConfirmation",
                                        confirm: "Yes, move this page to trash!",
                                        cancel: "Not now",
                                        message: _react2.default.createElement(
                                            "span",
                                            null,
                                            "Are you sure you want to move the page",
                                            _react2.default.createElement("br", null),
                                            _react2.default.createElement(
                                                "strong",
                                                null,
                                                data.title
                                            ),
                                            _react2.default.createElement("br", null),
                                            " and all of its revisions to trash?"
                                        ),
                                        onConfirm: function onConfirm() {
                                            return moveToTrash(data.id);
                                        },
                                        onComplete: function onComplete() {
                                            removePageFromList(data.id);
                                            _this2.setState({ page: null });
                                        }
                                    });
                                }
                            )
                        )
                    )
                );
            }
        }
    ]);
    return PageManager;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(PageManager, {
    modules: [
        "View",
        "ViewSwitcher",
        "Link",
        "Icon",
        "Input",
        "Grid",
        "Modal",
        "Button",
        "Scrollbar"
    ]
});
//# sourceMappingURL=PageManager.js.map
