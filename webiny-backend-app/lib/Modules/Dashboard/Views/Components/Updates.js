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

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @i18n.namespace Webiny.Backend.Dashboard
 */
var Updates = (function(_Webiny$Ui$View) {
    (0, _inherits3.default)(Updates, _Webiny$Ui$View);

    function Updates(props) {
        (0, _classCallCheck3.default)(this, Updates);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Updates.__proto__ || Object.getPrototypeOf(Updates)).call(this, props)
        );

        _this.state = {
            updates: [],
            loaded: false,
            dismissing: false
        };
        return _this;
    }

    (0, _createClass3.default)(Updates, [
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                (0, _get3.default)(
                    Updates.prototype.__proto__ || Object.getPrototypeOf(Updates.prototype),
                    "componentDidMount",
                    this
                ).call(this);
                this.getUpdates();
            }
        },
        {
            key: "getUpdates",
            value: function getUpdates() {
                var _this2 = this;

                // check local storage
                var updates = _webinyClient.Webiny.LocalStorage.get("dashboardUpdates");
                if (updates) {
                    var lastUpdate =
                        new Date() -
                        new Date(_webinyClient.Webiny.LocalStorage.get("dashboardLastUpdate"));
                    if (lastUpdate < 86400000) {
                        // 24h
                        this.setState({ updates: updates, loaded: true });
                        return;
                    }
                }

                // refresh dashboard updates
                return new _webinyClient.Webiny.Api.Endpoint("/entities/webiny/dashboard-updates")
                    .get("/latest")
                    .then(function(apiResponse) {
                        var updates = apiResponse.getData("list");
                        if (updates && updates.length > 0) {
                            _this2.setState({ updates: updates, loaded: true, dismissing: false });
                        } else {
                            _this2.setState({ updates: [], loaded: true, dismissing: false });
                        }

                        // store dashboard updates and the last update time
                        _webinyClient.Webiny.LocalStorage.set("dashboardUpdates", updates);
                        _webinyClient.Webiny.LocalStorage.set("dashboardLastUpdate", new Date());
                    });
            }
        },
        {
            key: "dismissUpdate",
            value: function dismissUpdate(id) {
                var _this3 = this;

                this.setState({ dismissing: true });
                return new _webinyClient.Webiny.Api.Endpoint("/entities/webiny/dashboard-updates")
                    .get("/" + id + "/dismiss")
                    .then(function(apiResponse) {
                        // remove local storage entries
                        _webinyClient.Webiny.LocalStorage.remove("dashboardUpdates");
                        _webinyClient.Webiny.LocalStorage.remove("dashboardLastUpdate");

                        // call the getUpdates function to refresh the dashboard list
                        _this3.getUpdates();
                    });
            }
        }
    ]);
    return Updates;
})(_webinyClient.Webiny.Ui.View);

Updates.defaultProps = {
    renderer: function renderer() {
        var _this4 = this;

        var _props = this.props,
            Grid = _props.Grid,
            Loader = _props.Loader,
            Carousel = _props.Carousel,
            Link = _props.Link,
            Icon = _props.Icon,
            View = _props.View;

        if (!this.state.loaded) {
            return _react2.default.createElement(
                Loader,
                null,
                _react2.default.createElement("span", null, this.i18n("Loading your updates..."))
            );
        }

        if (this.state.updates.length < 1) {
            return _react2.default.createElement(
                Grid.Row,
                null,
                _react2.default.createElement(Grid.Col, { all: 12 })
            );
        }

        return _react2.default.createElement(
            "div",
            { className: "block block--slider" },
            _react2.default.createElement(
                "div",
                { className: "block-header" },
                _react2.default.createElement(
                    "h4",
                    { className: "block-title-light pull-left" },
                    this.i18n("Updates from webiny.com")
                )
            ),
            _react2.default.createElement(
                "div",
                { className: "block-content block-content--dynamic-height" },
                _react2.default.createElement(
                    "div",
                    { className: "slider" },
                    _react2.default.createElement(
                        "div",
                        { className: "slides" },
                        this.state.dismissing &&
                            _react2.default.createElement(
                                Loader,
                                null,
                                _react2.default.createElement(
                                    "span",
                                    null,
                                    this.i18n("Loading your updates...")
                                )
                            ),
                        _react2.default.createElement(
                            Carousel,
                            { items: 1, dots: true },
                            _lodash2.default.get(this.state, "updates") &&
                                this.state.updates.map(function(post) {
                                    var link = "https://www.webiny.com/r/" + post.refId;
                                    return _react2.default.createElement(
                                        "div",
                                        { className: "slide slide--active", key: post.id },
                                        post.image &&
                                            _react2.default.createElement(
                                                "div",
                                                { className: "slide__image" },
                                                _react2.default.createElement("img", {
                                                    src: post.image
                                                })
                                            ),
                                        _react2.default.createElement(
                                            "div",
                                            { className: "slide__content" },
                                            _react2.default.createElement(
                                                "div",
                                                { className: "slide__title" },
                                                post.hasLink === true
                                                    ? _react2.default.createElement(
                                                          "a",
                                                          { href: link, target: "_blank" },
                                                          post.title
                                                      )
                                                    : post.title
                                            ),
                                            _react2.default.createElement(
                                                "div",
                                                { className: "slide__excerpt" },
                                                post.content
                                            )
                                        ),
                                        _react2.default.createElement(
                                            "div",
                                            { className: "slide__button" },
                                            post.hasLink &&
                                                _react2.default.createElement(
                                                    Link,
                                                    { type: "primary", url: link, newTab: true },
                                                    _this4.i18n("Learn more")
                                                ),
                                            _react2.default.createElement("br", null),
                                            _react2.default.createElement(
                                                Link,
                                                {
                                                    className: "dismiss",
                                                    onClick: function onClick() {
                                                        _this4.dismissUpdate(post.id);
                                                    }
                                                },
                                                _this4.i18n("Dismiss")
                                            )
                                        )
                                    );
                                })
                        )
                    )
                )
            )
        );
    }
};

exports.default = _webinyClient.Webiny.createComponent(Updates, {
    modules: ["Grid", "Loader", "Carousel", "Link", "Icon"]
});
//# sourceMappingURL=Updates.js.map
