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

var _get2 = require("babel-runtime/helpers/get");

var _get3 = _interopRequireDefault(_get2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyClient = require("webiny-client");

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

require("./style.scss");

var _infinity = require("./../../../Assets/images/infinity.png");

var _infinity2 = _interopRequireDefault(_infinity);

var _Updates = require("./Components/Updates");

var _Updates2 = _interopRequireDefault(_Updates);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @i18n.namespace Webiny.Backend.Dashboard.Dashboard
 */
var Dashboard = (function(_Webiny$Ui$View) {
    (0, _inherits3.default)(Dashboard, _Webiny$Ui$View);

    function Dashboard(props) {
        (0, _classCallCheck3.default)(this, Dashboard);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Dashboard.__proto__ || Object.getPrototypeOf(Dashboard)).call(this, props)
        );

        _this.state = {
            user: {}
        };
        return _this;
    }

    (0, _createClass3.default)(Dashboard, [
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                var _this2 = this;

                (0, _get3.default)(
                    Dashboard.prototype.__proto__ || Object.getPrototypeOf(Dashboard.prototype),
                    "componentDidMount",
                    this
                ).call(this);
                this.watch("User", function(user) {
                    _this2.setState({ user: user });
                });
            }
        },
        {
            key: "getUserName",
            value: function getUserName() {
                var user = this.state.user;
                if (_lodash2.default.get(user, "firstName", "") === "") {
                    return null;
                }

                return _lodash2.default.get(user, "firstName", "");
            }
        }
    ]);
    return Dashboard;
})(_webinyClient.Webiny.Ui.View);

Dashboard.defaultProps = {
    renderer: function renderer() {
        var _props = this.props,
            View = _props.View,
            Gravatar = _props.Gravatar,
            Button = _props.Button,
            Grid = _props.Grid,
            Icon = _props.Icon,
            Link = _props.Link;

        return _react2.default.createElement(
            View.Dashboard,
            null,
            _react2.default.createElement(
                View.Header,
                { title: this.i18n("Dashboard") },
                _react2.default.createElement(
                    View.Header.Center,
                    null,
                    _react2.default.createElement(
                        "div",
                        { className: "user-welcome" },
                        _react2.default.createElement(
                            "div",
                            { className: "user-welcome__avatar" },
                            _react2.default.createElement(
                                "div",
                                { className: "avatar avatar--inline avatar--small" },
                                _react2.default.createElement(
                                    "span",
                                    {
                                        className:
                                            "avatar-placeholder avatar-placeholder--no-border"
                                    },
                                    _react2.default.createElement(Gravatar, {
                                        className: "avatar img-responsive",
                                        hash: this.state.user.gravatar,
                                        size: "50"
                                    })
                                )
                            )
                        ),
                        _react2.default.createElement(
                            "h3",
                            { className: "user-welcome__message" },
                            "Hi ",
                            this.getUserName()
                        )
                    )
                ),
                _react2.default.createElement(
                    Button,
                    {
                        onClick: function onClick() {
                            return _webinyClient.Webiny.Router.goToRoute("Me.Account");
                        }
                    },
                    this.i18n("Manage Account")
                )
            ),
            _react2.default.createElement(
                View.Body,
                null,
                _react2.default.createElement(_Updates2.default, null),
                _react2.default.createElement(
                    Grid.Row,
                    null,
                    _react2.default.createElement(
                        Grid.Col,
                        { all: 4 },
                        _react2.default.createElement(
                            View.InfoBlock,
                            { title: this.i18n("GET STARTED") },
                            _react2.default.createElement(
                                "ul",
                                null,
                                _react2.default.createElement(
                                    "li",
                                    null,
                                    _react2.default.createElement(
                                        "div",
                                        { className: "block-list__item-image" },
                                        _react2.default.createElement(Icon, {
                                            icon: "icon-keys",
                                            size: "2x"
                                        })
                                    ),
                                    _react2.default.createElement(
                                        "a",
                                        {
                                            href:
                                                "https://www.webiny.com/docs/current/guides/components",
                                            className: "block-list__item-text",
                                            target: "_blank"
                                        },
                                        _react2.default.createElement(
                                            "strong",
                                            null,
                                            this.i18n("React Components")
                                        ),
                                        this.i18n(
                                            " - Learn what they do and how to implement them."
                                        )
                                    )
                                ),
                                _react2.default.createElement(
                                    "li",
                                    null,
                                    _react2.default.createElement(
                                        "div",
                                        { className: "block-list__item-image" },
                                        _react2.default.createElement(Icon, {
                                            icon: "fa-book ",
                                            size: "2x"
                                        })
                                    ),
                                    _react2.default.createElement(
                                        "a",
                                        {
                                            href: "https://www.webiny.com/hub/tutorials",
                                            className: "block-list__item-text",
                                            target: "_blank"
                                        },
                                        _react2.default.createElement(
                                            "strong",
                                            null,
                                            this.i18n("Tutorials")
                                        ),
                                        this.i18n(" - How to setup Webiny and other applications.")
                                    )
                                ),
                                _react2.default.createElement(
                                    "li",
                                    null,
                                    _react2.default.createElement(
                                        "div",
                                        { className: "block-list__item-image" },
                                        _react2.default.createElement(Icon, {
                                            icon: "fa-graduation-cap",
                                            size: "2x"
                                        })
                                    ),
                                    _react2.default.createElement(
                                        "a",
                                        {
                                            href:
                                                "https://www.webiny.com/docs/current/reference-manual/environments",
                                            className: "block-list__item-text",
                                            target: "_blank"
                                        },
                                        _react2.default.createElement(
                                            "strong",
                                            null,
                                            this.i18n("Reference Manual")
                                        ),
                                        this.i18n(
                                            " - The nitty-gritty details of how the internal components work."
                                        )
                                    )
                                )
                            )
                        )
                    ),
                    _react2.default.createElement(
                        Grid.Col,
                        { all: 4 },
                        _react2.default.createElement(
                            View.InfoBlock,
                            { title: this.i18n("THE HUB") },
                            _react2.default.createElement(
                                "div",
                                { className: "text-center dashboard--block--the-hub" },
                                _react2.default.createElement(
                                    "div",
                                    { className: "title-icon" },
                                    _react2.default.createElement("img", {
                                        src: _infinity2.default,
                                        alt: "Webiny Infinity"
                                    })
                                ),
                                _react2.default.createElement("h3", null, this.i18n("The Hub")),
                                _react2.default.createElement(
                                    "div",
                                    { className: "block-list__item-text" },
                                    this.i18n(
                                        "Ask questions, present your work, start or join a discussion, view or contribute a tutorial."
                                    )
                                ),
                                _react2.default.createElement("br", null),
                                _react2.default.createElement(
                                    "div",
                                    { className: "text-center" },
                                    _react2.default.createElement(
                                        Link,
                                        {
                                            url: "https://www.webiny.com/hub",
                                            newTab: true,
                                            type: "primary"
                                        },
                                        this.i18n("JOIN")
                                    )
                                )
                            )
                        )
                    ),
                    _react2.default.createElement(
                        Grid.Col,
                        { all: 4 },
                        _react2.default.createElement(
                            View.InfoBlock,
                            { title: this.i18n("SOCIALIZE") },
                            _react2.default.createElement(
                                "div",
                                null,
                                _react2.default.createElement(
                                    "ul",
                                    null,
                                    _react2.default.createElement(
                                        "li",
                                        null,
                                        _react2.default.createElement(
                                            "div",
                                            { className: "block-list__item-image" },
                                            _react2.default.createElement("span", {
                                                className: "icon icon-github icon-3x"
                                            })
                                        ),
                                        _react2.default.createElement(
                                            "a",
                                            {
                                                href: "https://github.com/Webiny/Webiny",
                                                className: "block-list__item-text",
                                                target: "_blank"
                                            },
                                            _react2.default.createElement(Icon, {
                                                icon: "fa-github"
                                            }),
                                            " ",
                                            this.i18n("GitHub")
                                        )
                                    ),
                                    _react2.default.createElement(
                                        "li",
                                        null,
                                        _react2.default.createElement(
                                            "div",
                                            { className: "block-list__item-image" },
                                            _react2.default.createElement("span", {
                                                className: "icon icon-twitter icon-3x"
                                            })
                                        ),
                                        _react2.default.createElement(
                                            "a",
                                            {
                                                href: "https://twitter.com/WebinyPlatform",
                                                className: "block-list__item-text",
                                                target: "_blank"
                                            },
                                            _react2.default.createElement(Icon, {
                                                icon: "fa-twitter"
                                            }),
                                            " ",
                                            this.i18n("Twitter")
                                        )
                                    ),
                                    _react2.default.createElement(
                                        "li",
                                        null,
                                        _react2.default.createElement(
                                            "div",
                                            { className: "block-list__item-image" },
                                            _react2.default.createElement("span", {
                                                className: "icon icon-medium icon-3x"
                                            })
                                        ),
                                        _react2.default.createElement(
                                            "a",
                                            {
                                                href: "https://blog.webiny.com",
                                                className: "block-list__item-text",
                                                target: "_blank"
                                            },
                                            _react2.default.createElement(Icon, {
                                                icon: "fa-medium"
                                            }),
                                            " ",
                                            this.i18n("Blog")
                                        )
                                    ),
                                    _react2.default.createElement(
                                        "li",
                                        null,
                                        _react2.default.createElement(
                                            "div",
                                            { className: "block-list__item-image" },
                                            _react2.default.createElement("span", {
                                                className: "icon icon-youtube icon-3x"
                                            })
                                        ),
                                        _react2.default.createElement(
                                            "a",
                                            {
                                                href: "https://video.webiny.com",
                                                className: "block-list__item-text",
                                                target: "_blank"
                                            },
                                            _react2.default.createElement(Icon, {
                                                icon: "fa-youtube"
                                            }),
                                            " ",
                                            this.i18n("YouTube")
                                        )
                                    ),
                                    _react2.default.createElement(
                                        "li",
                                        null,
                                        _react2.default.createElement(
                                            "div",
                                            { className: "block-list__item-image" },
                                            _react2.default.createElement("span", {
                                                className: "icon icon-youtube icon-3x"
                                            })
                                        ),
                                        _react2.default.createElement(
                                            "a",
                                            {
                                                href: "https://chat.webiny.com",
                                                className: "block-list__item-text",
                                                target: "_blank"
                                            },
                                            _react2.default.createElement(Icon, {
                                                icon: "fa-commenting-o"
                                            }),
                                            " ",
                                            this.i18n("Chat")
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
            )
        );
    }
};

exports.default = _webinyClient.Webiny.createComponent(Dashboard, {
    modules: ["View", "Gravatar", "Button", "Grid", "Icon", "Link"]
});
//# sourceMappingURL=Dashboard.js.map
