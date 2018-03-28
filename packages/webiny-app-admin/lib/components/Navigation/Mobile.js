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

var _get2 = require("lodash/get");

var _get3 = _interopRequireDefault(_get2);

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

var _jquery = require("jquery");

var _jquery2 = _interopRequireDefault(_jquery);

var _utils = require("./utils");

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Mobile = (function(_React$Component) {
    (0, _inherits3.default)(Mobile, _React$Component);

    function Mobile(props) {
        (0, _classCallCheck3.default)(this, Mobile);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Mobile.__proto__ || Object.getPrototypeOf(Mobile)).call(this, props)
        );

        _this.state = {};
        _this.menu = _webinyApp.app.services.get("menu");

        _this.onClick = _this.onClick.bind(_this);

        /**
         * Menu renderer passed to <Menu>.
         * Note that `this` is still bound to `Mobile` class since we are passing an arrow function.
         */
        _this.renderer = function(menu) {
            var props = (0, _clone3.default)(menu.props);
            if (!_utils2.default.canAccess(props)) {
                return null;
            }

            var level = props.level;
            var Link = _this.props.Link;

            var children = _react2.default.Children.toArray(props.children);
            var hasChildren = children.length > 0;

            var menuIconClass = (0, _classnames2.default)(
                "icon app-icon",
                { fa: (0, _includes3.default)(props.icon, "fa-") },
                props.icon
            );

            var linkProps = {
                key: props.id,
                label: props.label,
                onClick: _this.closeMobileMenu,
                children: [
                    props.icon
                        ? _react2.default.createElement("span", {
                              key: "icon",
                              className: menuIconClass
                          })
                        : null,
                    level > 1
                        ? props.label
                        : _react2.default.createElement(
                              "span",
                              { key: "title", className: "app-title" },
                              props.label
                          ),
                    hasChildren
                        ? _react2.default.createElement("span", {
                              key: "caret",
                              className: "icon icon-caret-down mobile-caret"
                          })
                        : null
                ]
            };

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
                linkProps.onClick = function(e) {
                    return _this.onClick(menu, e);
                };
            }

            var className = (0, _classnames2.default)({
                open: _this.state[props.id],
                active:
                    props.level === 0
                        ? _utils2.default.findRoute(props, _webinyApp.app.router.route.name)
                        : false
            });

            return _react2.default.createElement(
                "li",
                { className: className, key: props.id },
                _utils2.default.getLink(props.route, Link, linkProps),
                hasChildren &&
                    _react2.default.createElement(
                        "ul",
                        { className: "level-" + (level + 1) },
                        _react2.default.createElement(
                            "li",
                            {
                                className: "main-menu--close back",
                                onClick: function onClick(e) {
                                    return _this.onClick(menu, e);
                                }
                            },
                            "Go Back"
                        ),
                        childMenuItems
                    )
            );
        };
        return _this;
    }

    (0, _createClass3.default)(Mobile, [
        {
            key: "onClick",
            value: function onClick(menu, e) {
                e.stopPropagation();
                var state = this.state;
                state[menu.props.id] = !(0, _get3.default)(state, menu.props.id, false);
                this.setState(state);
            }
        },
        {
            key: "closeMobileMenu",
            value: function closeMobileMenu() {
                (0, _jquery2.default)("body").removeClass("mobile-nav");
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
                            _react2.default.createElement(
                                "li",
                                { className: "main-menu--close", onClick: this.closeMobileMenu },
                                "Close"
                            ),
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
    return Mobile;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(Mobile, { modules: ["Link"] });
//# sourceMappingURL=Mobile.js.map
