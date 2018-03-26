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

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

var _AppBox = require("./../Components/AppBox");

var _AppBox2 = _interopRequireDefault(_AppBox);

var _SubmitAppBox = require("./../Components/SubmitAppBox");

var _SubmitAppBox2 = _interopRequireDefault(_SubmitAppBox);

var _LoginRegister = require("./LoginRegister");

var _LoginRegister2 = _interopRequireDefault(_LoginRegister);

var _User = require("./../Components/User");

var _User2 = _interopRequireDefault(_User);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @i18n.namespace Webiny.Backend.Marketplace.Browse
 */
var Browse = (function(_Webiny$Ui$View) {
    (0, _inherits3.default)(Browse, _Webiny$Ui$View);

    function Browse(props) {
        (0, _classCallCheck3.default)(this, Browse);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Browse.__proto__ || Object.getPrototypeOf(Browse)).call(this, props)
        );

        _this.state = {
            apps: [],
            user: null,
            loadingUser: false
        };

        _this.bindMethods("onUser");
        return _this;
    }

    (0, _createClass3.default)(Browse, [
        {
            key: "componentWillMount",
            value: function componentWillMount() {
                var _this2 = this;

                (0, _get3.default)(
                    Browse.prototype.__proto__ || Object.getPrototypeOf(Browse.prototype),
                    "componentWillMount",
                    this
                ).call(this);
                this.setState({ loadingUser: true });
                this.meEp = new _webinyClient.Webiny.Api.Endpoint("/services/webiny/marketplace")
                    .get("/me")
                    .then(function(apiResponse) {
                        if (!apiResponse.isError()) {
                            _this2.onUser(apiResponse.getData());
                        }
                        _this2.setState({ loadingUser: false });
                    });
            }
        },
        {
            key: "componentWillUnmount",
            value: function componentWillUnmount() {
                (0, _get3.default)(
                    Browse.prototype.__proto__ || Object.getPrototypeOf(Browse.prototype),
                    "componentWillUnmount",
                    this
                ).call(this);
                this.meEp && this.meEp.cancel();
                this.appsEp && this.appsEp.cancel();
            }
        },
        {
            key: "loadApps",
            value: function loadApps() {
                var _this3 = this;

                this.setState({ loadingApps: true });
                this.appsEp = new _webinyClient.Webiny.Api.Endpoint("/services/webiny/marketplace")
                    .get("/apps")
                    .then(function(apiResponse) {
                        _this3.setState({ apps: apiResponse.getData("list"), loadingApps: false });
                    });
            }
        },
        {
            key: "onUser",
            value: function onUser(_ref) {
                var authToken = _ref.authToken,
                    user = _ref.user;

                this.setState({ authToken: authToken, user: user });
                if (user) {
                    this.loadApps();
                }
            }
        },
        {
            key: "renderBody",
            value: function renderBody() {
                var Loader = this.props.Loader;

                if (this.state.loadingUser) {
                    return _react2.default.createElement(Loader, null, this.i18n("Logging in..."));
                }

                if (this.state.loadingApps) {
                    return _react2.default.createElement(
                        Loader,
                        null,
                        this.i18n("Fetching Webiny apps...")
                    );
                }

                if (!this.state.user) {
                    return _react2.default.createElement(_LoginRegister2.default, {
                        onUser: this.onUser
                    });
                }

                var _props = this.props,
                    styles = _props.styles,
                    Link = _props.Link,
                    View = _props.View,
                    Icon = _props.Icon,
                    Grid = _props.Grid;

                return _react2.default.createElement(
                    "div",
                    { className: styles.browse },
                    _react2.default.createElement(
                        View.Dashboard,
                        null,
                        _react2.default.createElement(
                            View.Header,
                            { title: this.i18n("Marketplace") },
                            _react2.default.createElement(
                                View.Header.Center,
                                null,
                                _react2.default.createElement(_User2.default, {
                                    user: this.state.user
                                })
                            ),
                            this.props.appDetails
                                ? _react2.default.createElement(
                                      Link,
                                      { type: "default", route: "Marketplace.Browse" },
                                      this.i18n("Go Back")
                                  )
                                : _react2.default.createElement(
                                      Link,
                                      {
                                          newTab: true,
                                          type: "default",
                                          url:
                                              "https://www.webiny.com/token/" + this.state.authToken
                                      },
                                      _react2.default.createElement(Icon, { icon: "fa-cog" }),
                                      " ",
                                      this.i18n("Manage Account")
                                  )
                        ),
                        _react2.default.createElement(
                            View.Body,
                            null,
                            _react2.default.createElement(
                                _webinyClient.Webiny.Ui.Placeholder,
                                { name: "Apps" },
                                _react2.default.createElement(
                                    Grid.Row,
                                    { className: styles.appList },
                                    this.state.apps &&
                                        this.state.apps.map(function(app) {
                                            return _react2.default.createElement(
                                                Grid.Col,
                                                { all: 6, key: app.id },
                                                _react2.default.createElement(_AppBox2.default, {
                                                    app: app
                                                })
                                            );
                                        }),
                                    _react2.default.createElement(
                                        Grid.Col,
                                        { all: 6 },
                                        _react2.default.createElement(_SubmitAppBox2.default, null)
                                    )
                                )
                            )
                        )
                    )
                );
            }
        }
    ]);
    return Browse;
})(_webinyClient.Webiny.Ui.View);

Browse.defaultProps = {
    renderer: function renderer() {
        return this.renderBody();
    }
};

exports.default = _webinyClient.Webiny.createComponent(Browse, {
    styles: _styles2.default,
    modules: ["View", "Link", "Icon", "Grid", "Loader"]
});
//# sourceMappingURL=Browse.js.map
