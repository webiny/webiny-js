"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _taggedTemplateLiteral2 = require("babel-runtime/helpers/taggedTemplateLiteral");

var _taggedTemplateLiteral3 = _interopRequireDefault(_taggedTemplateLiteral2);

var _defineProperty2 = require("babel-runtime/helpers/defineProperty");

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

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

var _map2 = require("lodash/map");

var _map3 = _interopRequireDefault(_map2);

var _range2 = require("lodash/range");

var _range3 = _interopRequireDefault(_range2);

var _templateObject = (0, _taggedTemplateLiteral3.default)(["PREVIOUS"], ["PREVIOUS"]),
    _templateObject2 = (0, _taggedTemplateLiteral3.default)(["NEXT"], ["NEXT"]),
    _templateObject3 = (0, _taggedTemplateLiteral3.default)(
        ["Results per page"],
        ["Results per page"]
    );

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _webinyApp = require("webiny-app");

var _styles = require("../styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = _webinyApp.i18n.namespace("Webiny.Ui.List.Pagination");

var Pagination = (function(_React$Component) {
    (0, _inherits3.default)(Pagination, _React$Component);

    function Pagination(props) {
        (0, _classCallCheck3.default)(this, Pagination);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Pagination.__proto__ || Object.getPrototypeOf(Pagination)).call(this, props)
        );

        _this.renderPages = _this.renderPages.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(Pagination, [
        {
            key: "pageChanged",
            value: function pageChanged(page) {
                if (page === this.props.currentPage) {
                    return;
                }

                this.props.onPageChange(page);
            }
        },
        {
            key: "renderPages",
            value: function renderPages() {
                var _this2 = this;

                var cp = parseInt(this.props.currentPage);
                var tp = this.props.totalPages;
                var showLowDots = false;
                var showHighDots = false;
                var showPages = this.props.size === "large" ? 9 : 7;
                var padding = this.props.size === "large" ? 2 : 1;

                var pages = [];
                if (tp <= showPages) {
                    pages = tp > 1 ? (0, _range3.default)(1, tp + 1) : [1];
                } else {
                    if (cp - padding > 3) {
                        showLowDots = true;
                    }

                    if (cp + (padding + 2) < tp) {
                        showHighDots = true;
                    }

                    if (showLowDots && showHighDots) {
                        pages = [1, null];
                        var i = cp - padding;
                        for (i; i <= cp + padding; i++) {
                            pages.push(i);
                        }
                        pages.push(null);
                        pages.push(tp);
                    } else if (showLowDots) {
                        pages = (0, _range3.default)(tp - showPages + 3, tp + 1);
                        pages.unshift(null);
                        pages.unshift(1);
                    } else if (showHighDots) {
                        pages = (0, _range3.default)(1, showPages - 1);
                        pages.push(null);
                        pages.push(tp);
                    }
                }

                return (0, _map3.default)(pages, function(page, i) {
                    var key = page !== null ? page + "-" + i : "dots-" + i;
                    var onClick = page !== null ? _this2.pageChanged.bind(_this2, page) : null;
                    var className = cp === page ? _this2.props.styles.active : null;
                    return _react2.default.createElement(
                        "li",
                        { key: key, className: className, onClick: onClick },
                        _react2.default.createElement(
                            "a",
                            { href: "javascript:void(0);" },
                            page || "..."
                        )
                    );
                });
            }
        },
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                if (!this.props.count) {
                    return null;
                }

                var _props = this.props,
                    Grid = _props.Grid,
                    styles = _props.styles;

                var cp = parseInt(this.props.currentPage);
                var previousPage = cp === 1 ? null : this.pageChanged.bind(this, cp - 1);
                var previousClasses = (0, _classnames2.default)(
                    styles.previous,
                    (0, _defineProperty3.default)({}, styles.disabled, cp === 1)
                );

                var nextPage =
                    cp === this.props.totalPages ? null : this.pageChanged.bind(this, cp + 1);
                var nextClasses = (0, _classnames2.default)(
                    styles.next,
                    (0, _defineProperty3.default)({}, styles.disabled, cp === this.props.totalPages)
                );

                return _react2.default.createElement(
                    "webiny-list-pagination",
                    null,
                    _react2.default.createElement(
                        Grid.Row,
                        null,
                        _react2.default.createElement(
                            Grid.Col,
                            { all: 12 },
                            _react2.default.createElement(
                                "ul",
                                { className: (0, _classnames2.default)(styles.pagination) },
                                _react2.default.createElement(
                                    "li",
                                    { className: previousClasses, onClick: previousPage },
                                    _react2.default.createElement(
                                        "a",
                                        { href: "javascript:void(0)" },
                                        _react2.default.createElement("span", {
                                            className: "icon icon-caret-down"
                                        }),
                                        _react2.default.createElement(
                                            "span",
                                            null,
                                            t(_templateObject)
                                        )
                                    )
                                ),
                                this.renderPages(),
                                _react2.default.createElement(
                                    "li",
                                    { className: nextClasses, onClick: nextPage },
                                    _react2.default.createElement(
                                        "a",
                                        { href: "javascript:void(0)" },
                                        _react2.default.createElement(
                                            "span",
                                            null,
                                            t(_templateObject2)
                                        ),
                                        _react2.default.createElement("span", {
                                            className: "icon icon-caret-down"
                                        })
                                    )
                                )
                            )
                        ),
                        _react2.default.createElement(
                            Grid.Col,
                            { all: 12 },
                            this.props.renderPerPage.call(this),
                            _react2.default.createElement(
                                "span",
                                null,
                                "Total number of records: ",
                                _react2.default.createElement("strong", null, this.props.totalCount)
                            )
                        )
                    )
                );
            }
        }
    ]);
    return Pagination;
})(_react2.default.Component);

Pagination.defaultProps = {
    onPageChange: _noop3.default,
    onPerPageChange: _noop3.default,
    totalPages: 0,
    currentPage: 0,
    perPage: 0,
    perPageOptions: [10, 25, 50, 100],
    count: 0,
    totalCount: 0,
    size: "large", // large or small
    renderPerPage: function renderPerPage() {
        var _this3 = this;

        var _props2 = this.props,
            Dropdown = _props2.Dropdown,
            perPageOptions = _props2.perPageOptions;

        return _react2.default.createElement(
            Dropdown,
            {
                title: _react2.default.createElement(
                    "span",
                    null,
                    _react2.default.createElement("strong", null, this.props.perPage),
                    " per page"
                ),
                type: "balloon"
            },
            _react2.default.createElement(Dropdown.Header, { title: t(_templateObject3) }),
            perPageOptions.map(function(option) {
                return _react2.default.createElement(Dropdown.Link, {
                    key: option,
                    title: option,
                    onClick: function onClick() {
                        return _this3.props.onPerPageChange(option);
                    }
                });
            })
        );
    }
};

exports.default = (0, _webinyApp.createComponent)(Pagination, {
    modules: ["Grid", "Dropdown"],
    styles: _styles2.default
});
//# sourceMappingURL=Pagination.js.map
