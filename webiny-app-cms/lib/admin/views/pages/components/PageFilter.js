"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

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

var _isEmpty2 = require("lodash/isEmpty");

var _isEmpty3 = _interopRequireDefault(_isEmpty2);

var _get2 = require("lodash/get");

var _get3 = _interopRequireDefault(_get2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _webinyApp = require("webiny-app");

var _PageFilter = require("./PageFilter.scss?prefix=Webiny_CMS_PageFilter");

var _PageFilter2 = _interopRequireDefault(_PageFilter);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var PageFilter = (function(_React$Component) {
    (0, _inherits3.default)(PageFilter, _React$Component);

    function PageFilter(props) {
        (0, _classCallCheck3.default)(this, PageFilter);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (PageFilter.__proto__ || Object.getPrototypeOf(PageFilter)).call(this)
        );

        _this.state = {
            search: props.query || "",
            focused: false
        };

        _this.onKeyDown = _this.onKeyDown.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(PageFilter, [
        {
            key: "componentWillReceiveProps",
            value: function componentWillReceiveProps(props) {
                this.setState({ search: props.query || "" });
            }
        },
        {
            key: "onKeyDown",
            value: function onKeyDown(event) {
                if (event.metaKey || event.ctrlKey) {
                    return;
                }

                switch (event.key) {
                    case "Enter":
                        event.preventDefault();
                        this.props.setSearchQuery(event.target.value);
                        break;
                    default:
                        break;
                }
            }
        },
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                var _props = this.props,
                    _props$modules = _props.modules,
                    Link = _props$modules.Link,
                    Icon = _props$modules.Icon,
                    setFilter = _props.setFilter;

                var filter = (0, _get3.default)(this.props.filter, "filter", "all");

                var activeItem = "filter-bar__item--active";

                return _react2.default.createElement(
                    "div",
                    { className: _PageFilter2.default["filter-bar"] },
                    _react2.default.createElement(
                        "div",
                        {
                            onClick: function onClick() {
                                _this2.setState({ focused: true });
                                _this2.search.focus();
                            },
                            className: (0, _classnames2.default)(
                                _PageFilter2.default["filter-bar__search"],
                                (0, _defineProperty3.default)(
                                    {},
                                    _PageFilter2.default["has-search"],
                                    !(0, _isEmpty3.default)(this.props.query) || this.state.focused
                                )
                            )
                        },
                        _react2.default.createElement(
                            "label",
                            { htmlFor: "search" },
                            _react2.default.createElement(Icon, {
                                icon: ["fa", "search"],
                                size: "2x"
                            })
                        ),
                        _react2.default.createElement(
                            "div",
                            { className: _PageFilter2.default.inputContainer },
                            _react2.default.createElement("input", {
                                onBlur: function onBlur() {
                                    return _this2.setState({ focused: false });
                                },
                                ref: function ref(_ref) {
                                    return (_this2.search = _ref);
                                },
                                id: "search",
                                type: "text",
                                placeholder: "SEARCH",
                                value: this.state.search,
                                onKeyDown: this.onKeyDown,
                                onChange: function onChange(e) {
                                    return _this2.setState(
                                        { search: e.target.value },
                                        function() {}
                                    );
                                }
                            })
                        )
                    ),
                    _react2.default.createElement(
                        "div",
                        { className: _PageFilter2.default["filter-bar__items"] },
                        _react2.default.createElement(
                            Link,
                            {
                                className: (0, _classnames2.default)(
                                    _PageFilter2.default["filter-bar__item"],
                                    (0, _defineProperty3.default)(
                                        {},
                                        _PageFilter2.default[activeItem],
                                        filter === "all"
                                    )
                                ),
                                onClick: function onClick() {
                                    return setFilter({ filter: "all" });
                                }
                            },
                            "All ",
                            _react2.default.createElement("span", null)
                        ),
                        _react2.default.createElement(
                            Link,
                            {
                                className: (0, _classnames2.default)(
                                    _PageFilter2.default["filter-bar__item"],
                                    (0, _defineProperty3.default)(
                                        {},
                                        _PageFilter2.default[activeItem],
                                        filter === "published"
                                    )
                                ),
                                onClick: function onClick() {
                                    return setFilter({ filter: "published" });
                                }
                            },
                            "Published ",
                            _react2.default.createElement("span", null)
                        ),
                        _react2.default.createElement(
                            Link,
                            {
                                className: (0, _classnames2.default)(
                                    _PageFilter2.default["filter-bar__item"],
                                    (0, _defineProperty3.default)(
                                        {},
                                        _PageFilter2.default[activeItem],
                                        filter === "draft"
                                    )
                                ),
                                onClick: function onClick() {
                                    return setFilter({ filter: "draft" });
                                }
                            },
                            "Drafts ",
                            _react2.default.createElement("span", null)
                        ),
                        _react2.default.createElement(
                            Link,
                            {
                                className: (0, _classnames2.default)(
                                    _PageFilter2.default["filter-bar__item"],
                                    (0, _defineProperty3.default)(
                                        {},
                                        _PageFilter2.default[activeItem],
                                        filter === "pinned"
                                    )
                                ),
                                onClick: function onClick() {
                                    return setFilter({ filter: "pinned" });
                                }
                            },
                            "Pinned ",
                            _react2.default.createElement("span", null)
                        ),
                        _react2.default.createElement(
                            Link,
                            {
                                className: (0, _classnames2.default)(
                                    _PageFilter2.default["filter-bar__item"],
                                    (0, _defineProperty3.default)(
                                        {},
                                        _PageFilter2.default[activeItem],
                                        filter === "trash"
                                    )
                                ),
                                onClick: function onClick() {
                                    return setFilter({ filter: "trash" });
                                }
                            },
                            "Trash ",
                            _react2.default.createElement("span", null)
                        )
                    )
                );
            }
        }
    ]);
    return PageFilter;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(PageFilter, { modules: ["Icon", "Link"] });
//# sourceMappingURL=PageFilter.js.map
