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

var _get2 = require("lodash/get");

var _get3 = _interopRequireDefault(_get2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var UserMenu = (function(_React$Component) {
    (0, _inherits3.default)(UserMenu, _React$Component);

    function UserMenu(props) {
        (0, _classCallCheck3.default)(this, UserMenu);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (UserMenu.__proto__ || Object.getPrototypeOf(UserMenu)).call(this, props)
        );

        _this.state = {
            user: {}
        };

        _this.auth = _webinyApp.app.services.get("authentication");
        return _this;
    }

    (0, _createClass3.default)(UserMenu, [
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                var _this2 = this;

                this.unwatch = this.auth.onIdentity(function(identity) {
                    _this2.setState({ user: identity });
                });

                this.setState({ user: this.auth.identity });
            }
        },
        {
            key: "componentWillUnmount",
            value: function componentWillUnmount() {
                this.unwatch();
            }
        },
        {
            key: "getUserName",
            value: function getUserName() {
                var user = this.state.user;

                if (
                    !(0, _get3.default)(user, "firstName") &&
                    !(0, _get3.default)(user, "lastName")
                ) {
                    return (0, _get3.default)(user, "email");
                }

                return (
                    (0, _get3.default)(user, "firstName", "") +
                    " " +
                    (0, _get3.default)(user, "lastName", "")
                );
            }
        },
        {
            key: "renderLogoutMenuItem",
            value: function renderLogoutMenuItem() {
                var _this3 = this;

                var item = this.props.logoutMenuItem;
                if (!item) {
                    return null;
                }

                var logout = {
                    logout: function logout() {
                        _this3.auth.logout();
                    }
                };
                return _react2.default.isValidElement(item)
                    ? _react2.default.cloneElement(item, logout)
                    : _react2.default.createElement(item, logout);
            }
        },
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                if (!this.state.user) {
                    return null;
                }

                return _react2.default.createElement(
                    "div",
                    { className: "dropdown profile-holder" },
                    _react2.default.createElement(
                        "a",
                        { href: "#", className: "profile", "data-toggle": "dropdown" },
                        _react2.default.createElement("span", { className: "icon-user icon" }),
                        _react2.default.createElement(
                            "span",
                            { className: "user" },
                            this.getUserName()
                        )
                    ),
                    _react2.default.createElement(
                        "div",
                        { className: "drop dropdown-menu", role: "menu" },
                        _react2.default.createElement("span", { className: "top-arr" }),
                        _react2.default.createElement(
                            "ul",
                            null,
                            this.props.userMenuItems.map(function(item, i) {
                                return _react2.default.createElement(
                                    "li",
                                    { key: i },
                                    _react2.default.isValidElement(item)
                                        ? item
                                        : _react2.default.createElement(item)
                                );
                            })
                        ),
                        this.renderLogoutMenuItem()
                    )
                );
            }
        }
    ]);
    return UserMenu;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(UserMenu, {
    modules: [
        {
            userMenuItems: function userMenuItems() {
                return _webinyApp.app.modules.loadByTag("user-menu-item").then(function(modules) {
                    return Object.values(modules).filter(function(m) {
                        return !(0, _isNil3.default)(m);
                    });
                });
            },
            logoutMenuItem: "Admin.UserMenu.Logout"
        }
    ]
});
//# sourceMappingURL=index.js.map
