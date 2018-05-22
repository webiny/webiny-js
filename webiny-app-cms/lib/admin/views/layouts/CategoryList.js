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

var _webinyApp = require("webiny-app");

var _CategoryModal = require("./CategoryModal");

var _CategoryModal2 = _interopRequireDefault(_CategoryModal);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var CategoryList = (function(_React$Component) {
    (0, _inherits3.default)(CategoryList, _React$Component);

    function CategoryList() {
        (0, _classCallCheck3.default)(this, CategoryList);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (CategoryList.__proto__ || Object.getPrototypeOf(CategoryList)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(CategoryList, [
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                var _props$modules = this.props.modules,
                    View = _props$modules.View,
                    ViewSwitcher = _props$modules.ViewSwitcher,
                    Link = _props$modules.Link,
                    Icon = _props$modules.Icon,
                    List = _props$modules.List,
                    ListData = _props$modules.ListData,
                    Table = _props$modules.List.Table;

                return _react2.default.createElement(
                    View.List,
                    null,
                    _react2.default.createElement(
                        View.Header,
                        {
                            title: "Categories",
                            description: "Page categories help organize your content."
                        },
                        _react2.default.createElement(
                            Link,
                            {
                                type: "primary",
                                align: "right",
                                onClick: function onClick() {
                                    return _this2.viewSwitcher.showView("form")();
                                }
                            },
                            _react2.default.createElement(Icon, { icon: ["fa", "plus-circle"] }),
                            "Create new category"
                        )
                    ),
                    _react2.default.createElement(
                        View.Body,
                        null,
                        _react2.default.createElement(
                            ViewSwitcher,
                            {
                                onReady: function onReady(viewSwitcher) {
                                    return (_this2.viewSwitcher = viewSwitcher);
                                }
                            },
                            _react2.default.createElement(
                                ViewSwitcher.View,
                                { name: "list", defaultView: true },
                                function(_ref) {
                                    var showView = _ref.showView;
                                    return _react2.default.createElement(
                                        ListData,
                                        {
                                            onReady: function onReady(actions) {
                                                return (_this2.list = actions);
                                            },
                                            entity: "CmsCategory",
                                            fields: "id title slug url createdOn",
                                            perPage: 10
                                        },
                                        function(listProps) {
                                            return _react2.default.createElement(
                                                List,
                                                listProps,
                                                _react2.default.createElement(
                                                    Table,
                                                    null,
                                                    _react2.default.createElement(
                                                        Table.Row,
                                                        null,
                                                        _react2.default.createElement(
                                                            Table.Field,
                                                            {
                                                                name: "title",
                                                                align: "left",
                                                                label: "Title",
                                                                sort: "title"
                                                            },
                                                            function(_ref2) {
                                                                var data = _ref2.data;
                                                                return _react2.default.createElement(
                                                                    "div",
                                                                    null,
                                                                    _react2.default.createElement(
                                                                        "a",
                                                                        {
                                                                            href: "#",
                                                                            onClick: function onClick() {
                                                                                return showView(
                                                                                    "form"
                                                                                )(data);
                                                                            }
                                                                        },
                                                                        _react2.default.createElement(
                                                                            "strong",
                                                                            null,
                                                                            data.title
                                                                        )
                                                                    ),
                                                                    _react2.default.createElement(
                                                                        "br",
                                                                        null
                                                                    ),
                                                                    _react2.default.createElement(
                                                                        "span",
                                                                        {
                                                                            style: { color: "#999" }
                                                                        },
                                                                        "ID: ",
                                                                        data.id
                                                                    )
                                                                );
                                                            }
                                                        ),
                                                        _react2.default.createElement(Table.Field, {
                                                            name: "slug",
                                                            align: "left",
                                                            label: "Slug",
                                                            sort: "slug"
                                                        }),
                                                        _react2.default.createElement(Table.Field, {
                                                            name: "url",
                                                            align: "left",
                                                            label: "URL",
                                                            sort: "url"
                                                        }),
                                                        _react2.default.createElement(
                                                            Table.DateTimeField,
                                                            {
                                                                name: "createdOn",
                                                                align: "left",
                                                                label: "Date ",
                                                                sort: "createdOn"
                                                            }
                                                        ),
                                                        _react2.default.createElement(
                                                            Table.Actions,
                                                            null,
                                                            _react2.default.createElement(
                                                                Table.EditAction,
                                                                {
                                                                    onClick: function onClick(
                                                                        params
                                                                    ) {
                                                                        return showView("form")(
                                                                            params.data
                                                                        );
                                                                    }
                                                                }
                                                            ),
                                                            _react2.default.createElement(
                                                                Table.DeleteAction,
                                                                null
                                                            )
                                                        )
                                                    )
                                                ),
                                                _react2.default.createElement(List.Pagination, null)
                                            );
                                        }
                                    );
                                }
                            ),
                            _react2.default.createElement(
                                ViewSwitcher.View,
                                { name: "form", modal: true },
                                function(_ref3) {
                                    var data = _ref3.data;
                                    return _react2.default.createElement(_CategoryModal2.default, {
                                        name: "createCategory",
                                        data: data,
                                        onSuccess: function onSuccess() {
                                            return _this2.list.loadRecords();
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
    return CategoryList;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(CategoryList, {
    modules: ["ViewSwitcher", "View", "Link", "Icon", "List", "ListData"]
});
//# sourceMappingURL=CategoryList.js.map
