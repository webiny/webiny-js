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

var _isNil2 = require("lodash/isNil");

var _isNil3 = _interopRequireDefault(_isNil2);

var _includes2 = require("lodash/includes");

var _includes3 = _interopRequireDefault(_includes2);

var _clone2 = require("lodash/clone");

var _clone3 = _interopRequireDefault(_clone2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _webinyApp = require("webiny-app");

var _utils = require("./utils");

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Desktop = (function(_React$Component) {
    (0, _inherits3.default)(Desktop, _React$Component);

    function Desktop(props) {
        (0, _classCallCheck3.default)(this, Desktop);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Desktop.__proto__ || Object.getPrototypeOf(Desktop)).call(this, props)
        );

        _this.state = {};
        _this.onClick = _this.onClick.bind(_this);

        _this.menu = _webinyApp.app.services.get("menu");

        /**
         * Menu renderer passed to <Menu>.
         * Note that `this` is still bound to `Desktop` class since we are passing an arrow function.
         */
        _this.renderer = function(menu) {
            var props = (0, _clone3.default)(menu.props);
            if (!_utils2.default.canAccess(props)) {
                return null;
            }

            var children = _react2.default.Children.toArray(props.children);
            var hasChildren = children.length > 0;
            var Link = _this.props.Link;

            var menuIconClass = (0, _classnames2.default)(
                "icon app-icon",
                { fa: (0, _includes3.default)(props.icon, "fa-") },
                props.icon
            );

            var linkProps = {
                key: props.id,
                label: props.label,
                children: [
                    props.icon
                        ? _react2.default.createElement("span", {
                              key: "icon",
                              className: menuIconClass
                          })
                        : null,
                    props.level > 1
                        ? props.label
                        : _react2.default.createElement(
                              "span",
                              { key: "title", className: "app-title" },
                              props.label
                          ),
                    hasChildren && props.level > 0
                        ? _react2.default.createElement("span", {
                              key: "caret",
                              className: "icon icon-caret-down"
                          })
                        : null
                ]
            };

            var className = (0, _classnames2.default)({
                open: _this.state.open === props.id,
                active:
                    props.level === 0
                        ? _utils2.default.findRoute(props, _webinyApp.app.router.route.name)
                        : false
            });

            var childMenuItems = null;
            if (hasChildren) {
                // Build array of child items and check their access roles.
                childMenuItems = children.map(function(child, i) {
                    if (!_utils2.default.canAccess(child.props)) {
                        return null;
                    }

                    return _react2.default.cloneElement(child, { key: i, render: _this.renderer });
                });

                // If no child items are there to render - hide parent menu as well.
                if (
                    !childMenuItems.filter(function(item) {
                        return !(0, _isNil3.default)(item);
                    }).length
                ) {
                    return null;
                }
            }

            return _react2.default.createElement(
                "li",
                {
                    className: className,
                    key: props.id,
                    onClick: function onClick() {
                        return _this.onClick(menu);
                    }
                },
                _utils2.default.getLink(props.route, Link, linkProps),
                hasChildren &&
                    _react2.default.createElement(
                        "ul",
                        { className: "level-" + (props.level + 1) },
                        childMenuItems
                    )
            );
        };
        return _this;
    }

    (0, _createClass3.default)(Desktop, [
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                this.setState({ active: _utils2.default.checkRoute(_webinyApp.app.router.route) });
            }
        },
        {
            key: "onClick",
            value: function onClick(menu) {
                if (menu.props.level === 0) {
                    this.setState({ open: menu.props.id });
                }
            }
        },
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                return _react2.default.createElement(
                    "div",
                    { className: "navigation" },
                    _react2.default.createElement("div", { className: "shield" }),
                    _react2.default.createElement(
                        "div",
                        { className: "main-menu" },
                        _react2.default.createElement(
                            "ul",
                            { className: "menu-list level-0" },
                            this.menu.getMenu().map(function(menu) {
                                return _react2.default.cloneElement(menu, {
                                    key: menu.props.id,
                                    render: _this2.renderer
                                });
                            })
                        )
                    )
                );
            }
        }
    ]);
    return Desktop;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(Desktop, { modules: ["Link"] });
//# sourceMappingURL=Desktop.js.map
